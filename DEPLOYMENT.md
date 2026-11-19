# CloudBox Deployment

## Windows CMD

Create configuration:

```cmd
copy .env.example .env
```

Install and start infrastructure:

```cmd
npm ci
docker compose up -d postgres redis minio
```

Generate random secrets in a local password manager and set `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` in `.env`.

Start migrations and the application:

```cmd
npm run db:generate
npm run db:migrate
npm run dev
```

Open `http://localhost:3000` and `http://localhost:3000/api/v1/docs`.

Full Docker deployment:

```cmd
docker compose up -d --build
docker compose logs -f api
```

## Ubuntu

Install Node.js 22, Docker, Docker Compose, and Nginx, then clone the repository:

```bash
cd /opt
sudo git clone https://github.com/Malekfhima/CloudBox.git
cd CloudBox
sudo cp .env.example .env
sudo npm ci
sudo docker compose up -d postgres redis minio
sudo npm run db:generate
sudo npm run db:migrate
```

Start as a systemd service:

```bash
sudo tee /etc/systemd/system/cloudbox.service >/dev/null <<'EOF'
[Unit]
Description=CloudBox API
After=network.target docker.service

[Service]
Type=simple
WorkingDirectory=/opt/CloudBox
ExecStart=/usr/bin/npx tsx server.ts
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now cloudbox
```

Configure Nginx:

```bash
sudo cp nginx.conf /etc/nginx/sites-available/cloudbox
sudo ln -s /etc/nginx/sites-available/cloudbox /etc/nginx/sites-enabled/cloudbox
sudo nginx -t
sudo systemctl reload nginx
```

Put TLS termination and firewall rules in front of Nginx. The API must never receive or expose S3 credentials to browsers.

## Validation

```cmd
npm run lint
npm test
npm run build
docker compose config
```

On Ubuntu, use the same npm commands.
