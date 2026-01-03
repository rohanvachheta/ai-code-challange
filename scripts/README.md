# Automotive Data Scripts

Simple and clean scripts for data generation and system testing.

## 📋 Available Scripts

### 1. Data Generation Script
```bash
npm run generate
```
**Purpose**: Generate sample data and sync with Elasticsearch
**What it does**:
- Creates sample users (buyers, sellers, carriers, agents)
- Generates vehicle offers
- Syncs data to Elasticsearch via Kafka
- Shows current database and Elasticsearch status

### 2. System Testing Script  
```bash
npm run test
```
**Purpose**: Check if everything is running smoothly
**What it tests**:
- All microservices (User, Offer, Purchase, Transport, Search)
- All databases connectivity
- Data existence in tables
- Elasticsearch functionality
- Basic API operations (create/read users)

## 🎯 Quick Start

1. Make sure all services are running (Docker containers)
2. Generate some data: `npm run generate`
3. Test everything: `npm run test`

## 📊 Expected Results

- **Data Generation**: Creates users and offers, syncs to Elasticsearch
- **System Test**: Should show 100% success rate if all services are healthy

That's it! Simple and effective. 🚀