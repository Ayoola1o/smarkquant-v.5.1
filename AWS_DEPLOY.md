# AWS Deployment Guide - EC2 vs Kubernetes (EKS)

## Table of Contents
1. [Comparison Overview](#comparison-overview)
2. [EC2 Deployment Guide](#ec2-deployment-guide)
3. [Kubernetes (EKS) Deployment Guide](#kubernetes-eks-deployment-guide)
4. [Monitoring & High Availability](#monitoring--high-availability)
5. [Cost Optimization](#cost-optimization)
6. [Troubleshooting](#troubleshooting)

---

## Comparison Overview

### EC2 (Recommended for Your Use Case)
**Best for: Small to medium-scale trading applications**

| Aspect | EC2 | Kubernetes |
|--------|-----|-----------|
| **Setup Complexity** | Simple (30-60 min) | Complex (2-4 hours) |
| **Cost** | $20-50/month (t3.medium) | $70-150/month (minimum cluster) |
| **Scaling** | Manual or ASG | Auto-scaling (built-in) |
| **Maintenance** | Moderate | High |
| **Learning Curve** | Low | High |
| **Best For** | Single/dual instance apps | Large distributed systems |
| **Operational Load** | Low | Medium-High |

### **RECOMMENDATION: EC2** 
For your trading bot backend (Python/Flask), EC2 is the better choice because:
- ✅ Simpler to set up and maintain
- ✅ Lower cost for single instance
- ✅ Easier to debug trading logic
- ✅ Sufficient for current scale
- ⚠️ Use Kubernetes only if expect 10x+ traffic growth

---

## EC2 Deployment Guide

### Prerequisites
- AWS Account with billing enabled
- AWS CLI installed locally
- SSH key pair created
- Docker basics knowledge

### Step 1: Create EC2 Instance

#### Via AWS CLI:
```bash
# Create security group
aws ec2 create-security-group \
  --group-name smarkquant-sg \
  --description "Security group for SMarkQuant trading bot"

# Get security group ID
SG_ID=$(aws ec2 describe-security-groups \
  --filters "Name=group-name,Values=smarkquant-sg" \
  --query 'SecurityGroups[0].GroupId' \
  --output text)

# Allow SSH (22), HTTP (80), HTTPS (443)
aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp --port 22 --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp --port 80 --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp --port 443 --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp --port 8000 --cidr 0.0.0.0/0

# Launch t3.medium instance (2 vCPU, 4GB RAM - suitable for trading bot)
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t3.medium \
  --key-name your-key-pair-name \
  --security-group-ids $SG_ID \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=smarkquant-server}]' \
  --root-volume-size 30 \
  --monitoring Enabled=true
```

#### Via AWS Console:
1. Go to EC2 Dashboard → Instances
2. Click "Launch Instances"
3. Select Ubuntu 22.04 LTS AMI
4. Instance Type: **t3.medium** (recommended)
5. Configure Security Group (allow ports 22, 80, 443, 8000)
6. Launch

### Step 2: Connect to Instance

```bash
# SSH into instance
ssh -i /path/to/key.pem ubuntu@<public-ip>

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
sudo apt install -y docker.io git curl

# Add ubuntu to docker group
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### Step 3: Deploy Application

```bash
# Clone your repository
git clone https://github.com/Ayoola1o/smarkquant-v.5.1.git
cd smarkquant-v.5.1

# Create .env file with AWS credentials and Supabase config
cat > backend/.env << 'EOF'
# Database
DATABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-key

# Alpaca API (if trading)
APCA_API_BASE_URL=https://paper-api.alpaca.markets
APCA_API_KEY_ID=your-alpaca-key
APCA_API_SECRET_KEY=your-alpaca-secret

# Flask
FLASK_ENV=production
FLASK_APP=main.py
SECRET_KEY=$(python3 -c 'import secrets; print(secrets.token_hex(32))')

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
EOF

# Build and run with Docker Compose
docker-compose up -d

# Verify services are running
docker ps
docker-compose logs -f
```

### Step 4: Set Up Nginx Reverse Proxy

```bash
# Install Nginx
sudo apt install -y nginx

# Create Nginx config
sudo tee /etc/nginx/sites-available/smarkquant > /dev/null <<EOF
upstream backend {
    server localhost:8000;
}

upstream frontend {
    server localhost:3000;
}

server {
    listen 80;
    server_name your-domain.com;

    # Redirect HTTP to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL certificates (generate with Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;

    # Backend API
    location /api {
        proxy_pass http://backend;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/smarkquant /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx config
sudo nginx -t

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Step 5: SSL Certificate with Let's Encrypt

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Generate certificate
sudo certbot certonly --nginx -d your-domain.com

# Auto-renewal (certbot handles this automatically)
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

### Step 6: Enable 24/7 Uptime with Systemd

Create systemd service files to auto-restart on failure:

```bash
# Create backend service
sudo tee /etc/systemd/system/smarkquant-backend.service > /dev/null <<EOF
[Unit]
Description=SMarkQuant Backend Service
After=network.target docker.service
Requires=docker.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/smarkquant-v.5.1
ExecStart=docker-compose -f /home/ubuntu/smarkquant-v.5.1/docker-compose.yml up
ExecStop=docker-compose -f /home/ubuntu/smarkquant-v.5.1/docker-compose.yml down
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable smarkquant-backend.service
sudo systemctl start smarkquant-backend.service

# Verify status
sudo systemctl status smarkquant-backend.service
```

### Step 7: Monitoring & Alerts

```bash
# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
sudo dpkg -i -E ./amazon-cloudwatch-agent.deb

# Configure CloudWatch for CPU/Memory monitoring
sudo tee /opt/aws/amazon-cloudwatch-agent/etc/config.json > /dev/null <<EOF
{
  "metrics": {
    "namespace": "SMarkQuant",
    "metrics_collected": {
      "cpu": {
        "measurement": [
          {
            "name": "cpu_usage_idle",
            "rename": "CPU_IDLE",
            "unit": "Percent"
          }
        ],
        "metrics_collection_interval": 60
      },
      "mem": {
        "measurement": [
          {
            "name": "mem_used_percent",
            "rename": "MEM_USED",
            "unit": "Percent"
          }
        ],
        "metrics_collection_interval": 60
      },
      "disk": {
        "measurement": [
          {
            "name": "used_percent",
            "rename": "DISK_USED",
            "unit": "Percent"
          }
        ],
        "metrics_collection_interval": 60,
        "resources": ["/"]
      }
    }
  }
}
EOF

# Start CloudWatch agent
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config \
  -m ec2 \
  -s \
  -c file:/opt/aws/amazon-cloudwatch-agent/etc/config.json
```

### Step 8: Auto-Scaling Setup

```bash
# Create AMI from current instance
aws ec2 create-image \
  --instance-id i-xxxxxxxxx \
  --name smarkquant-ami \
  --description "SMarkQuant Trading Bot AMI"

# Create Launch Template
aws ec2 create-launch-template \
  --launch-template-name smarkquant-lt \
  --launch-template-data '{
    "ImageId":"ami-xxxxxxxxx",
    "InstanceType":"t3.medium",
    "KeyName":"your-key-pair",
    "SecurityGroupIds":["sg-xxxxxxxxx"],
    "TagSpecifications":[{
      "ResourceType":"instance",
      "Tags":[{"Key":"Name","Value":"smarkquant-instance"}]
    }]
  }'

# Create Auto Scaling Group
aws autoscaling create-auto-scaling-group \
  --auto-scaling-group-name smarkquant-asg \
  --launch-template LaunchTemplateName=smarkquant-lt,Version='$Latest' \
  --min-size 1 \
  --max-size 3 \
  --desired-capacity 1 \
  --availability-zones us-east-1a us-east-1b
```

### Step 9: Backup Strategy

```bash
# Create daily backup script
cat > /home/ubuntu/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DATE=$(date +%Y-%m-%d-%H-%M-%S)
BACKUP_DIR="/home/ubuntu/backups"

mkdir -p $BACKUP_DIR

# Backup Docker volumes
docker run --rm \
  -v trading_data:/data \
  -v $BACKUP_DIR:/backup \
  alpine tar czf /backup/trading-data-$BACKUP_DATE.tar.gz -C /data .

# Upload to S3
aws s3 cp $BACKUP_DIR/trading-data-$BACKUP_DATE.tar.gz \
  s3://smarkquant-backups/ \
  --region us-east-1

# Keep only last 7 days
find $BACKUP_DIR -mtime +7 -delete
EOF

chmod +x /home/ubuntu/backup.sh

# Add to crontab (daily at 2 AM)
echo "0 2 * * * /home/ubuntu/backup.sh" | crontab -
```

---

## Kubernetes (EKS) Deployment Guide

**Use this only if you plan to scale significantly or run multiple services**

### Step 1: Prerequisites

```bash
# Install required tools
brew install aws-cli kubectl helm eksctl

# Configure AWS CLI
aws configure
```

### Step 2: Create EKS Cluster

```bash
# Create cluster using eksctl (easiest method)
eksctl create cluster \
  --name smarkquant-cluster \
  --version 1.28 \
  --region us-east-1 \
  --nodegroup-name smarkquant-nodes \
  --node-type t3.medium \
  --nodes 2 \
  --nodes-min 1 \
  --nodes-max 3 \
  --enable-ssm

# Update kubeconfig
aws eks update-kubeconfig \
  --region us-east-1 \
  --name smarkquant-cluster

# Verify cluster
kubectl get nodes
```

### Step 3: Create Docker Images

```bash
# Create backend Dockerfile
cat > backend/Dockerfile << 'EOF'
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PYTHONUNBUFFERED=1
ENV FLASK_APP=main.py

EXPOSE 8000

CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "4", "--timeout", "120", "main:app"]
EOF

# Build and push to ECR
aws ecr create-repository --repository-name smarkquant-backend
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

docker build -t smarkquant-backend .
docker tag smarkquant-backend:latest ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/smarkquant-backend:latest
docker push ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/smarkquant-backend:latest
```

### Step 4: Create Kubernetes Manifests

```bash
# Create namespace
kubectl create namespace smarkquant

# Create ConfigMap for environment variables
cat > k8s/configmap.yaml << 'EOF'
apiVersion: v1
kind: ConfigMap
metadata:
  name: smarkquant-config
  namespace: smarkquant
data:
  FLASK_ENV: production
  LOG_LEVEL: info
EOF

# Create Secrets
kubectl create secret generic smarkquant-secrets \
  --from-literal=SUPABASE_URL=your-url \
  --from-literal=SUPABASE_KEY=your-key \
  -n smarkquant
```

### Step 5: Create Backend Deployment

```bash
cat > k8s/backend-deployment.yaml << 'EOF'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: smarkquant-backend
  namespace: smarkquant
spec:
  replicas: 2
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: smarkquant-backend
  template:
    metadata:
      labels:
        app: smarkquant-backend
    spec:
      containers:
      - name: backend
        image: ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/smarkquant-backend:latest
        imagePullPolicy: Always
        ports:
        - containerPort: 8000
        env:
        - name: FLASK_ENV
          valueFrom:
            configMapKeyRef:
              name: smarkquant-config
              key: FLASK_ENV
        - name: SUPABASE_URL
          valueFrom:
            secretKeyRef:
              name: smarkquant-secrets
              key: SUPABASE_URL
        - name: SUPABASE_KEY
          valueFrom:
            secretKeyRef:
              name: smarkquant-secrets
              key: SUPABASE_KEY
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: smarkquant-backend-svc
  namespace: smarkquant
spec:
  selector:
    app: smarkquant-backend
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8000
  type: LoadBalancer
EOF

kubectl apply -f k8s/backend-deployment.yaml
```

### Step 6: Set Up Auto-Scaling

```bash
# Install Metrics Server
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# Create HPA (Horizontal Pod Autoscaler)
cat > k8s/hpa.yaml << 'EOF'
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: smarkquant-hpa
  namespace: smarkquant
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: smarkquant-backend
  minReplicas: 2
  maxReplicas: 5
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
EOF

kubectl apply -f k8s/hpa.yaml
```

### Step 7: Set Up Ingress

```bash
# Install NGINX Ingress Controller
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm install nginx-ingress ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace

# Create Ingress resource
cat > k8s/ingress.yaml << 'EOF'
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: smarkquant-ingress
  namespace: smarkquant
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - your-domain.com
    secretName: smarkquant-tls
  rules:
  - host: your-domain.com
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: smarkquant-backend-svc
            port:
              number: 80
EOF

kubectl apply -f k8s/ingress.yaml
```

### Step 8: Deploy Frontend

```bash
cat > k8s/frontend-deployment.yaml << 'EOF'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: smarkquant-frontend
  namespace: smarkquant
spec:
  replicas: 2
  selector:
    matchLabels:
      app: smarkquant-frontend
  template:
    metadata:
      labels:
        app: smarkquant-frontend
    spec:
      containers:
      - name: frontend
        image: ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/smarkquant-frontend:latest
        imagePullPolicy: Always
        ports:
        - containerPort: 3000
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
---
apiVersion: v1
kind: Service
metadata:
  name: smarkquant-frontend-svc
  namespace: smarkquant
spec:
  selector:
    app: smarkquant-frontend
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: ClusterIP
EOF

kubectl apply -f k8s/frontend-deployment.yaml
```

### Step 9: Monitoring with Prometheus & Grafana

```bash
# Add Helm repo
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Install Prometheus
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace

# Access Grafana
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80
# Login: admin / prom-operator
```

### Step 10: Persistent Storage

```bash
cat > k8s/pvc.yaml << 'EOF'
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: trading-data-pvc
  namespace: smarkquant
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 20Gi
  storageClassName: ebs-sc
---
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: ebs-sc
provisioner: ebs.csi.aws.com
parameters:
  type: gp3
  iops: "3000"
  throughput: "125"
EOF

kubectl apply -f k8s/pvc.yaml
```

---

## Monitoring & High Availability

### EC2 Health Checks

```bash
# Health check endpoint (add to backend)
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow(),
        'uptime': get_uptime()
    }), 200
```

### CloudWatch Alarms

```bash
# CPU Usage alarm
aws cloudwatch put-metric-alarm \
  --alarm-name smarkquant-high-cpu \
  --alarm-description "Alert when CPU > 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/EC2 \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --alarm-actions arn:aws:sns:us-east-1:ACCOUNT_ID:smarkquant-alerts

# Memory check
aws cloudwatch put-metric-alarm \
  --alarm-name smarkquant-high-memory \
  --alarm-description "Alert when Memory > 85%" \
  --metric-name MemoryUtilization \
  --namespace CWAgent \
  --statistic Average \
  --period 300 \
  --threshold 85 \
  --comparison-operator GreaterThanThreshold \
  --alarm-actions arn:aws:sns:us-east-1:ACCOUNT_ID:smarkquant-alerts
```

### Kubernetes Health Probes

- **Liveness Probe**: Restarts unhealthy pods
- **Readiness Probe**: Removes from load balancer if unhealthy
- **Startup Probe**: Waits for app initialization

---

## Cost Optimization

### EC2 Optimization
| Strategy | Savings |
|----------|---------|
| Reserved Instances (1-year) | 25-30% |
| Spot Instances | 70% |
| Right-sizing (t3.medium) | $20-30/month |
| Scheduled scaling | 15-20% |

### Kubernetes Optimization
| Strategy | Savings |
|----------|---------|
| Spot instances for node groups | 70% |
| Fargate Spot | 70% |
| Pod autoscaling | 10-15% |
| Resource requests/limits | 20-30% |

### Estimated Monthly Costs

**EC2 Only:**
- t3.medium instance: $25
- EBS storage: $1.50
- Data transfer: $5-10
- **Total: ~$35-40/month**

**Kubernetes (EKS):**
- EKS cluster: $73
- 2x t3.medium nodes: $50
- EBS storage: $5
- Data transfer: $5-10
- NAT Gateway: $32
- **Total: ~$170-180/month**

---

## Troubleshooting

### EC2 Common Issues

**Issue: Instance won't start**
```bash
# Check CloudTrail for API errors
aws cloudtrail lookup-events --lookup-attributes AttributeKey=ResourceName,AttributeValue=your-instance-id
```

**Issue: High CPU/Memory**
```bash
# SSH to instance and diagnose
top
docker stats
docker logs -f <container-id>
```

**Issue: Connection refused**
```bash
# Check security groups
aws ec2 describe-security-groups --group-ids sg-xxxxxxxxx

# Check if service is running
systemctl status smarkquant-backend.service
docker ps
```

### Kubernetes Common Issues

**Issue: Pods not running**
```bash
kubectl describe pod <pod-name> -n smarkquant
kubectl logs <pod-name> -n smarkquant
```

**Issue: Service not accessible**
```bash
kubectl get svc -n smarkquant
kubectl port-forward svc/smarkquant-backend-svc 8000:80 -n smarkquant
```

**Issue: Persistent storage issues**
```bash
kubectl get pvc -n smarkquant
kubectl describe pvc trading-data-pvc -n smarkquant
```

---

## Disaster Recovery

### Backup Strategy (Both EC2 & EKS)

**Daily automated backups:**
```bash
# S3 bucket creation
aws s3 mb s3://smarkquant-backups-$(date +%s) --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket smarkquant-backups \
  --versioning-configuration Status=Enabled

# Set lifecycle policy (keep 30 days)
aws s3api put-bucket-lifecycle-configuration \
  --bucket smarkquant-backups \
  --lifecycle-configuration file://lifecycle.json
```

### Recovery Procedure

**EC2:**
1. Restore from latest S3 backup
2. Launch new instance from AMI
3. Attach restored data volume
4. Update Route 53 DNS

**EKS:**
1. Use Velero for cluster backup
2. Restore to new cluster
3. Update DNS records

---

## Final Recommendation

**Choose EC2 if:**
- ✅ Running single trading bot instance
- ✅ Want simplicity and low maintenance
- ✅ Budget is tight (~$40/month)
- ✅ Don't need auto-scaling

**Choose Kubernetes if:**
- ✅ Running multiple services
- ✅ Need 10+ instances
- ✅ Want production-grade orchestration
- ✅ Budget is $170+/month

**For SMarkQuant: Deploy on EC2 now, migrate to EKS when you need to scale.**

---

## Quick Start Commands

### EC2 Quick Deploy
```bash
# SSH to instance
ssh -i key.pem ubuntu@IP

# Clone and deploy
git clone https://github.com/Ayoola1o/smarkquant-v.5.1.git
cd smarkquant-v.5.1
docker-compose up -d

# Check status
docker ps && docker logs -f backend
```

### EKS Quick Deploy
```bash
# Create cluster
eksctl create cluster --name smarkquant --nodes 2

# Deploy app
kubectl create namespace smarkquant
kubectl apply -f k8s/ -n smarkquant

# Get URL
kubectl get ingress -n smarkquant
```

---

## Support & Resources

- **AWS Documentation**: https://docs.aws.amazon.com/ec2/
- **EKS Best Practices**: https://aws.github.io/aws-eks-best-practices/
- **Docker Compose**: https://docs.docker.com/compose/
- **Kubernetes Docs**: https://kubernetes.io/docs/
