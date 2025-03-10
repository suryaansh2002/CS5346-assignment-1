# World Happiness Dashboard

Welcome to the World Happiness Dashboard, an interactive visualization tool designed to explore the World Happiness Report data from 2020 to 2024. This project is developed as part of Assignment 1 for the CS5346 course: 'Information Visualisation' at the National University of Singapore (NUS).

## Project Overview

The World Happiness Dashboard provides a comprehensive view of various factors contributing to the happiness scores of countries worldwide. It allows users to interactively explore and compare data across different years and countries, offering insights into how different factors like GDP, social support, health, and perceptions of corruption influence happiness.

## Features

- **Interactive Visualizations**: Utilize various chart types such as bar charts, line charts, scatter plots, and radar charts to visualize data.
- **Year and Country Selection**: Easily switch between different years and select specific countries to focus on.
- **Comparison Mode**: Compare happiness factors across multiple years.
- **Correlation Analysis**: Analyze the correlation between happiness scores and various factors.
- **Responsive Design**: Optimized for both desktop and mobile viewing.

## Data Source

The data used in this project is sourced from the [World Happiness Report](https://worldhappiness.report/) and is available on [Kaggle](https://www.kaggle.com/datasets/samithsachidanandan/world-happiness-report-2020-2024).

## Deployment

The project is deployed and can be accessed at: [World Happiness Dashboard](https://cs-5346-assignment-1.suryaanshrathinam.com/)

## Installation

To run this project locally, follow these steps:

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser** and navigate to `http://localhost:3000` to view the dashboard.

## Usage

- **Select Year**: Use the year selector to view data for a specific year.
- **Compare Years**: Toggle the comparison mode to analyze trends over multiple years.
- **Select Countries**: Click on countries to add or remove them from the analysis.
- **View Correlations**: Explore the correlation analysis section to understand the impact of different factors on happiness.

## Code Structure

- **`src/pages/index.js`**: Main component rendering the dashboard and handling data fetching and state management.
- **`src/data/world_happiness.json`**: Contains the happiness data used for visualization.

## Technologies Used

- **React**: For building the user interface.
- **Recharts**: For creating interactive charts and visualizations.
- **PapaParse**: For parsing CSV data.
- **Next.js**: For server-side rendering and static site generation.

## Contributors

- **Suryaansh Rathinam**: [Website](https://www.suryaanshrathinam.com/)


## Acknowledgments

Special thanks to the CS5346 course instructors and the World Happiness Report team for providing the data and inspiration for this project.
