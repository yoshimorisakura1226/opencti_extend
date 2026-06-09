# OpenCTI Extend Tool

This tool provides extended functionality for OpenCTI, specifically focusing on label management and automation rules.

## Features

### Merge
* **Manual Label Merging**: Allows users to manually merge multiple labels into a target label.

### Group (Automation)
* **Label Merging Automation**: Automatically merges labels based on predefined rules.
* **Association Adding**: Automatically creates associations between labels based on specific conditions.

---

## Development & Customization
If you wish to modify the code and build your own version of the image:

### Step 1
Download or clone the entire source code repository.

### Step 2
After making your modifications, build the Docker image using the following command:

```bash
docker build -t opencti-extend-tool:latest .
```

### Step 3
Export the newly built image to a `.tar` file for distribution.

```bash
docker save opencti-extend-tool:latest -o opencti-extend-tool.tar
```

## Installation Steps

Follow these steps to deploy the tool in your OpenCTI environment.

### Step 1
Download the `opencti-extend-tool.tar` file.

### Step 2
Place the downloaded file into your `opencti/docker` directory.

### Step 3
Navigate to the `opencti/docker/` directory in your terminal and load the image:

```bash
docker load -i opencti-extend-tool.tar
```

### Step 4
Add the following configuration to your `docker-compose.yml` file.

```yaml
extend-tool:
    image: opencti-extend-tool:latest
    container_name: opencti-extend
    environment:
      - OPENCTI_URL=http://opencti:8080
      - OPENCTI_TOKEN=changeme
      - OPENCTI_ADMIN_EMAIL=changeme
      - OPENCTI_ADMIN_PASSWORD=changeme
      - PORT=8081
    ports:
      - "8081:8081"
    restart: always
```
==Note: Please replace changeme with your actual OpenCTI configuration credentials.==

### Step 5
Start the service by running the following command in the same directory.

```bash
docker compose up -d
```