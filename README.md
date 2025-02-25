# deeper-sleeper
Dive deeper into Sleeper fantasy football league stats

**Goal**: Provide my league with a website to track, visualize, and compare team performances throughout the season by pulling league data from [Sleeper's API](https://docs.sleeper.com/#introduction)

**Tech Stack**:
- Python FastAPI
- React (Typescript) + Vite
- Tailwind CSS
- Docker
- MongoDB
- AWS ECR, ECS (and other supporting services to publicly host the site)

**Personal Objectives**:
- Practice and familiarize with Python through building an API and crunching some numbers.
- Enhance understanding of React by creating my own app from scratch.
- Learn how to host a website using cloud services such as AWS.
- Explore other tools and services, such as Github Actions, to build a modern, automated CI/CD pipeline.

**Infrastructure Overview**

I decided to host using AWS because of semi-familiarity with it's services and capabilities and because of its general popularity. The below services are what I ultimately used to be able to host the app with a publicly accessible website and to have a rudimentary deployment process.
- **Elastic Container Service** (ECS): since I planned to use Docker to containerize the project locally, ECS seems like a good solution to easily transfer my Docker container definitions to AWS and host the containerized app. The app is organized into "api" and "web" code bases which will each have their own containers that are pushed to their separate ECR repositories.
  - **Elastic Container Registry** (ECR): to be able to run our containerized app in the cloud, ECR is utilized to hold our Docker images. After building, tagging, and pushing our Docker images to ECR, a **Task Definition** is created for each of our ECS services to assign their respective images to run and define other container parameters.
- **Virtual Private Cloud** (VPC): a container for our containers. To allow our ECS services to communicate with each other, we can isolate them into a VPC, allowing them to communicate between each other via a private network within the VPC while also keeping them secure. More generally, a VPC allows us to define routing, security groups and access permissions, etc. between our services residing in the VPC.
- **Application Load Balancer** (ALB): while the VPC can allow communication between our services, the ALB allows us to define an entry point for public traffic into the VPC and also handles routing and load balancing to services in the VPC. It also allows us to keep the BE service private and restricted from public access.
  - The ALB also becomes necessary due to the nature of using React as the FE framework. Since our FE is a React app, our FE service does not actually run our application but instead serves up the web files to users to run the app in the browser. That means that any api requests that the FE makes are actually going to be made from the internet outside of the VPC, requiring the ALB to properly allow access and route to the backend service.
- **Route 53** and **AWS Certificate Manager** (ACM): Utilizing the ALB allowed public access to our hosted web app but it required accessing via public IP address assigned to the ECS Task running the FE. This meant that connection to the app was over insecure HTTP and the address was anything but easy to remember, especially considering restarting the FE Task meant a new public IP address. To make things more fun and easier for visitors, Route 53 can be used to register a domain name. To also secure our site's connection over HTTPS rather than HTTP an SSL certificate was issued through ACM for our domain (and subdomains).