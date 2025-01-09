# deeper-sleeper
Dive into Sleeper fantasy football league stats

**Objective**: Use the [Sleeper API](https://docs.sleeper.com/#introduction) to pull my Sleeper fantasy football league's data to provide visualizations and analysis on various league and team stats.

**Tech**:
- Python FastAPI
- React + Vite
- Tailwind CSS
- Docker
- MongoDB Atlas
- AWS ECR, ECS (and other supporting services)


**Goals**:
- [x] get project running via docker/docker-compose locally
- [x] connect backend to MongoDB instance
- [x] set up cloud hosting to allow public access to project
- [x] push WIP site up as POC (currently at http://3.231.22.74:3000)
- [ ] build backend functionality to process relevant data
- [ ] command to backfill data for a season
- [ ] cronjobs for pulling data at regular intervals so we can display up to date data after each week during the season
- [ ] testing
- [ ] build a CI/CD pipeline for automated deploys