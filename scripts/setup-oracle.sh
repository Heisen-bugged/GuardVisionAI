#!/bin/bash

# Configuration
COMPARTMENT_ID="ocid1.tenancy.oc1..aaaaaaaabyblfc4hl6hdvztvsve45ckje63gugdobb4w3r3kq3u5vkukfyxq"
SUBNET_ID="ocid1.subnet.oc1.eu-frankfurt-1.aaaaaaaa2p6kkhho53a77v3nbyddf7ldup2j5zryuxpeam53ve4lzsaxkgga"
SECURITY_LIST_ID="ocid1.securitylist.oc1.eu-frankfurt-1.aaaaaaaaolfnucsnutmrvget34zmylq4l3bjtx3gshab3th4v5g5dt7ebp2q"
SSH_PUBLIC_KEY_FILE="$HOME/.ssh/id_ed25519.pub"

echo "🚀 Starting Oracle Cloud Provisioning for PocketBase..."

# 1. Update Security List to open ports 80, 443, 8090
echo "🔓 Updating Security List rules..."
EXISTING_RULES=$(oci network security-list get --security-list-id $SECURITY_LIST_ID --query "data.\"ingress-security-rules\"")

# Create a temporary file with new rules
cat > new_rules.json <<EOF
[
  {
    "description": "HTTP",
    "protocol": "6",
    "source": "0.0.0.0/0",
    "source-type": "CIDR_BLOCK",
    "tcp-options": { "destination-port-range": { "max": 80, "min": 80 } }
  },
  {
    "description": "HTTPS",
    "protocol": "6",
    "source": "0.0.0.0/0",
    "source-type": "CIDR_BLOCK",
    "tcp-options": { "destination-port-range": { "max": 443, "min": 443 } }
  },
  {
    "description": "PocketBase",
    "protocol": "6",
    "source": "0.0.0.0/0",
    "source-type": "CIDR_BLOCK",
    "tcp-options": { "destination-port-range": { "max": 8090, "min": 8090 } }
  }
]
EOF

# Merge rules (simplistic merge)
COMBINED_RULES=$(echo "$EXISTING_RULES" | jq ". + $(cat new_rules.json)")
oci network security-list update --security-list-id $SECURITY_LIST_ID --ingress-security-rules "$COMBINED_RULES" --force

# 2. Find Ubuntu 22.04 ARM Image
echo "🔍 Finding latest Ubuntu 22.04 ARM image..."
IMAGE_ID=$(oci compute image list --compartment-id $COMPARTMENT_ID --operating-system "Canonical Ubuntu" --operating-system-version "22.04" --shape "VM.Standard.A1.Flex" --limit 1 --query "data[0].id" --raw-output)

if [ -z "$IMAGE_ID" ]; then
    echo "❌ Failed to find Ubuntu image. Please check your region capacity."
    exit 1
fi

# 3. Create User Data Script
cat > user-data.sh <<EOF
#!/bin/bash
# Open OS Firewall
iptables -I INPUT 6 -p tcp --dport 80 -j ACCEPT
iptables -I INPUT 6 -p tcp --dport 443 -j ACCEPT
iptables -I INPUT 6 -p tcp --dport 8090 -j ACCEPT
netfilter-persistent save

# Install PocketBase
mkdir -p /opt/pocketbase
cd /opt/pocketbase
wget https://github.com/pocketbase/pocketbase/releases/download/v0.24.4/pocketbase_0.24.4_linux_arm64.zip
apt-get update && apt-get install -y unzip
unzip pocketbase_0.24.4_linux_arm64.zip
rm pocketbase_0.24.4_linux_arm64.zip
chmod +x pocketbase

# Setup Systemd
cat > /etc/systemd/system/pocketbase.service <<EOT
[Unit]
Description=PocketBase Service
After=network.target

[Service]
Type=simple
User=root
Group=root
WorkingDirectory=/opt/pocketbase
ExecStart=/opt/pocketbase/pocketbase serve --http="0.0.0.0:8090"
Restart=always

[Install]
WantedBy=multi-user.target
EOT

systemctl enable pocketbase
systemctl start pocketbase
EOF

# 4. Launch Instance
echo "🛰️ Attempting to launch VM.Standard.A1.Flex (ARM) instance..."
INSTANCE_INFO=$(oci compute instance launch \
    --compartment-id $COMPARTMENT_ID \
    --availability-domain $(oci iam availability-domain list --query "data[0].name" --raw-output) \
    --shape "VM.Standard.A1.Flex" \
    --shape-config '{"ocpus":1,"memoryInGBs":6}' \
    --subnet-id $SUBNET_ID \
    --display-name "GuardVision-Backend" \
    --image-id $IMAGE_ID \
    --ssh-authorized-keys-file $SSH_PUBLIC_KEY_FILE \
    --user-data-file user-data.sh 2>&1)

if [[ $INSTANCE_INFO == *"Out of host capacity"* ]]; then
    echo "⚠️ ARM capacity full. Falling back to VM.Standard.E2.1.Micro (AMD)..."
    
    # Find AMD Image
    AMD_IMAGE_ID=$(oci compute image list --compartment-id $COMPARTMENT_ID --operating-system "Canonical Ubuntu" --operating-system-version "22.04" --shape "VM.Standard.E2.1.Micro" --limit 1 --query "data[0].id" --raw-output)
    
    INSTANCE_INFO=$(oci compute instance launch \
        --compartment-id $COMPARTMENT_ID \
        --availability-domain $(oci iam availability-domain list --query "data[0].name" --raw-output) \
        --shape "VM.Standard.E2.1.Micro" \
        --subnet-id $SUBNET_ID \
        --display-name "GuardVision-Backend-AMD" \
        --image-id $AMD_IMAGE_ID \
        --ssh-authorized-keys-file $SSH_PUBLIC_KEY_FILE \
        --user-data-file user-data.sh)
fi

INSTANCE_ID=$(echo "$INSTANCE_INFO" | jq -r '.data.id')

if [ "$INSTANCE_ID" == "null" ] || [ -z "$INSTANCE_ID" ]; then
    echo "❌ Failed to launch instance. Output:"
    echo "$INSTANCE_INFO"
    exit 1
fi

echo "⏳ Waiting for instance to get a public IP..."
sleep 20
PUBLIC_IP=$(oci compute instance list-vnics --instance-id $INSTANCE_ID --query "data[0].\"public-ip\"" --raw-output)

echo "--------------------------------------------------"
echo "✅ Provisioning Complete!"
echo "📍 Public IP: $PUBLIC_IP"
echo "🛠️ PocketBase will be available at: http://$PUBLIC_IP:8090/_/"
echo "--------------------------------------------------"
echo "Next Steps:"
echo "1. Visit the PocketBase admin UI and create your account."
echo "2. Add the URL http://$PUBLIC_IP:8090 to your GitHub Secrets as POCKETBASE_URL."
echo "--------------------------------------------------"

rm user-data.sh new_rules.json
