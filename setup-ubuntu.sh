#!/bin/bash

set -e

apt update && apt upgrade -y

apt install -y apt-transport-https ca-certificates curl software-properties-common

curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add -

add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"

apt update

apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

apt install -y git

fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab

cd /root

read -p "Enter your GitHub repository URL (e.g., https://github.com/YOUR_USERNAME/YOUR_REPO.git): " GITHUB_REPO_URL

git clone "$GITHUB_REPO_URL" carhaus

cd carhaus

cp .env.example .env

read -p "Open .env in nano editor to configure? (y/n): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]
then
    nano .env
fi

chmod +x deploy.sh

./deploy.sh

echo "Setup complete!"
echo "Access your application at http://YOUR_SERVER_IP"

