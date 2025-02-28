"use client";

import { useState, useEffect, useMemo } from "react";
import {
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  LineChart,
  Line,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  ComposedChart,
  Area,
} from "recharts";
import Papa from "papaparse";

export default function HappinessDashboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedYears, setSelectedYears] = useState(["2020", "2021", "2022", "2023", "2024"]);
  const [availableYears, setAvailableYears] = useState(["2020", "2021", "2022", "2023", "2024"]);
  const [yearData, setYearData] = useState({});
  const [activeYear, setActiveYear] = useState("2020");
  const [isComparing, setIsComparing] = useState(false);

  // Define color palette
  const colors = [
    "#8884d8",
    "#83a6ed",
    "#8dd1e1",
    "#82ca9d",
    "#a4de6c",
    "#d0ed57",
    "#ffc658",
    "#ff8042",
    "#ff6361",
    "#bc5090",
  ];

  // Year colors for consistent coloring
  const yearColors = {
    "2020": "#8884d8",
    "2021": "#82ca9d",
    "2022": "#ffc658",
    "2023": "#ff8042",
    "2024": "#ff6361",
  };

  // Fetch and parse CSV data for all years
  useEffect(() => {
    async function fetchAllData() {
      setLoading(true);
      try {
        const years = ["2020", "2021", "2022", "2023", "2024"];
        const dataPromises = years.map(year => fetchYearData(year));
        
        // Wait for all data to be fetched
        const results = await Promise.allSettled(dataPromises);
        
        // Process results
        const successfulYears = [];
        const allYearData = {};
        
        results.forEach((result, index) => {
          if (result.status === "fulfilled" && result.value.data.length > 0) {
            const year = years[index];
            successfulYears.push(year);
            allYearData[year] = result.value.data;
          }
        });
        
        setAvailableYears(successfulYears);
        setYearData(allYearData);
        
        // Set active year to the most recent available year
        if (successfulYears.length > 0) {
          const mostRecentYear = successfulYears[successfulYears.length - 1];
          setActiveYear(mostRecentYear);
          setData(allYearData[mostRecentYear]);
        }
        
        setLoading(false);
      } catch (err) {
        setError("Failed to load data: " + err.message);
        setLoading(false);
      }
    }

    fetchAllData();
  }, []);

  // Function to fetch data for a specific year
  async function fetchYearData(year) {
    try {
      const response = await fetch(`/${year}.csv`);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${year} data`);
      }
      const csvText = await response.text();
      
      return new Promise((resolve, reject) => {
        Papa.parse(csvText, {
          header: true,
          complete: (results) => {
            // Clean and transform data
            const cleanedData = results.data
              .filter((row) => row["Country name"] && row["Happiness score"])
              .map((row) => ({
                country: row["Country name"],
                rank: Number.parseInt(row["Happiness Rank"] || "0", 10),
                score: Number.parseFloat(row["Happiness score"] || "0"),
                gdp: Number.parseFloat(
                  row["Economy (GDP per Capita)\t"] || "0"
                ),
                socialSupport: Number.parseFloat(row["Social support"] || "0"),
                health: Number.parseFloat(
                  row["Healthy life expectancy"] || "0"
                ),
                freedom: Number.parseFloat(
                  row["Freedom to make life choices"] || "0"
                ),
                generosity: Number.parseFloat(row["Generosity"] || "0"),
                corruption: Number.parseFloat(
                  row["Perceptions of corruption"] || "0"
                ),
                year: year,
              }));
            
            resolve({ data: cleanedData });
          },
          error: (error) => {
            reject(error);
          },
        });
      });
    } catch (err) {
      console.warn(`Could not load data for ${year}:`, err.message);
      return { data: [] };
    }
  }

  // Handle year selection
  const handleYearChange = (year) => {
    if (isComparing) {
      // For comparison mode, toggle the year in selectedYears
      setSelectedYears(prev => 
        prev.includes(year) 
          ? prev.filter(y => y !== year) 
          : [...prev, year]
      );
    } else {
      // For single year mode, set the active year
      setActiveYear(year);
      setData(yearData[year]);
    }
  };

  // Toggle comparison mode
  const toggleComparisonMode = () => {
    setIsComparing(!isComparing);
    if (!isComparing) {
      // When enabling comparison, start with the active year selected
      setSelectedYears([activeYear]);
    } else {
      // When disabling comparison, set data to active year
      setData(yearData[activeYear]);
    }
  };

  // Get combined data for selected years
  const combinedData = useMemo(() => {
    if (!isComparing) return data;
    
    let combined = [];
    selectedYears.forEach(year => {
      if (yearData[year]) {
        combined = [...combined, ...yearData[year]];
      }
    });
    return combined;
  }, [isComparing, selectedYears, yearData, data]);

  // Get top 10 happiest countries for the current view
  const topCountries = useMemo(() => {
    if (isComparing) {
      // For comparison mode, get top countries for each selected year
      const topByYear = {};
      selectedYears.forEach(year => {
        if (yearData[year]) {
          topByYear[year] = [...yearData[year]]
            .sort((a, b) => b.score - a.score)
            .slice(0, 10)
            .map(country => ({...country, year}));
        }
      });
      
      // Flatten the results
      return Object.values(topByYear).flat();
    } else {
      // For single year mode
      return [...data].sort((a, b) => b.score - a.score).slice(0, 10);
    }
  }, [data, isComparing, selectedYears, yearData]);

  // Get bottom 10 least happy countries for the current view
  const bottomCountries = useMemo(() => {
    if (isComparing) {
      // For comparison mode, get bottom countries for each selected year
      const bottomByYear = {};
      selectedYears.forEach(year => {
        if (yearData[year]) {
          bottomByYear[year] = [...yearData[year]]
            .sort((a, b) => a.score - b.score)
            .slice(0, 10)
            .map(country => ({...country, year}));
        }
      });
      
      // Flatten the results
      return Object.values(bottomByYear).flat();
    } else {
      // For single year mode
      return [...data].sort((a, b) => a.score - b.score).slice(0, 10);
    }
  }, [data, isComparing, selectedYears, yearData]);

  // Prepare data for radar chart
  const radarData = useMemo(() => {
    if (selectedCountries.length === 0) return [];

    const factors = [
      "gdp",
      "socialSupport",
      "health",
      "freedom",
      "generosity",
      "corruption",
    ];

    return factors.map((factor) => {
      const factorData = { factor };
      
      if (isComparing) {
        // For comparison mode, include data for each country and year
        selectedCountries.forEach((country) => {
          selectedYears.forEach(year => {
            if (yearData[year]) {
              const countryData = yearData[year].find(item => item.country === country);
              if (countryData) {
                factorData[`${country} (${year})`] = countryData[factor];
              }
            }
          });
        });
      } else {
        // For single year mode
        selectedCountries.forEach((country) => {
          const countryData = data.find((item) => item.country === country);
          if (countryData) {
            factorData[country] = countryData[factor];
          }
        });
      }
      
      return factorData;
    });
  }, [data, selectedCountries, isComparing, selectedYears, yearData]);

  // Prepare data for scatter plot
  const scatterData = useMemo(() => {
    return combinedData.map((item) => ({
      x: item.gdp,
      y: item.score,
      country: item.country,
      z: item.rank,
      year: item.year,
    }));
  }, [combinedData]);

  // Prepare trend data for countries over years
  const trendData = useMemo(() => {
    if (selectedCountries.length === 0) return [];
    
    const countryTrends = [];
    
    selectedCountries.forEach(country => {
      availableYears.forEach(year => {
        if (yearData[year]) {
          const countryData = yearData[year].find(item => item.country === country);
          if (countryData) {
            countryTrends.push({
              country,
              year,
              score: countryData.score,
              gdp: countryData.gdp,
              socialSupport: countryData.socialSupport,
              health: countryData.health,
              freedom: countryData.freedom,
              generosity: countryData.generosity,
              corruption: countryData.corruption,
            });
          }
        }
      });
    });
    
    return countryTrends;
  }, [selectedCountries, availableYears, yearData]);

  // Handle country selection
  const toggleCountrySelection = (country) => {
    setSelectedCountries(
      (prev) =>
        prev.includes(country)
          ? prev.filter((c) => c !== country)
          : [...prev, country].slice(0, 5) // Limit to 5 countries
    );
  };

  // Get average happiness score by year
  const averageScoreByYear = useMemo(() => {
    const averages = [];
    availableYears.forEach(year => {
      if (yearData[year] && yearData[year].length > 0) {
        const avg = yearData[year].reduce((sum, item) => sum + item.score, 0) / yearData[year].length;
        averages.push({
          year,
          score: avg,
        });
      }
    });
    return averages;
  }, [availableYears, yearData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>Error loading data: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">
            World Happiness Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Interactive visualization of the World Happiness Report data
            (2020-2024)
          </p>
          
          {/* Year selector */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="flex items-center">
              <span className="mr-2 text-sm font-medium text-gray-700">
                {isComparing ? "Compare Years:" : "Select Year:"}
              </span>
              <div className="flex flex-wrap gap-2">
                {availableYears.map((year) => (
                  <button
                    key={year}
                    onClick={() => handleYearChange(year)}
                    className={`px-3 py-1 text-sm rounded-full transition-colors ${
                      isComparing
                        ? selectedYears.includes(year)
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        : activeYear === year
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>
            
            <button
              onClick={toggleComparisonMode}
              className={`ml-auto px-4 py-1 text-sm rounded-md transition-colors ${
                isComparing
                  ? "bg-blue-100 text-blue-700 border border-blue-300"
                  : "bg-gray-100 text-gray-700 border border-gray-300"
              }`}
            >
              {isComparing ? "Disable Comparison" : "Compare Years"}
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="hidden lg:block max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab("overview")}
                className={`${
                  activeTab === "overview"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab("factors")}
                className={`${
                  activeTab === "factors"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
              >
                Happiness Factors
              </button>
              <button
                onClick={() => setActiveTab("comparison")}
                className={`${
                  activeTab === "comparison"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
              >
                Country Comparison
              </button>
              <button
                onClick={() => setActiveTab("correlation")}
                className={`${
                  activeTab === "correlation"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
              >
                Correlation Analysis
              </button>
              <button
                onClick={() => setActiveTab("trends")}
                className={`${
                  activeTab === "trends"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
              >
                Trends Over Time
              </button>
            </nav>
          </div>
        </div>

        {/* Dashboard content */}
        <div className="space-y-6">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Global Trends Section */}
              {isComparing && availableYears.length > 1 && (
                <div className="bg-white p-6 rounded-lg shadow">
                  <h2 className="text-xl font-semibold mb-1">
                    Global Happiness Trends
                  </h2>
                  <p className="text-sm text-gray-500 mb-4">
                    Average happiness score across all countries by year
                  </p>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={averageScoreByYear}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" />
                        <YAxis domain={[0, 10]} />
                        <Tooltip formatter={(value) => value.toFixed(2)} />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="score"
                          stroke="#8884d8"
                          name="Average Happiness Score"
                          strokeWidth={2}
                          dot={{ r: 6 }}
                          activeDot={{ r: 8 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
              
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-1">
                  Top 10 Happiest Countries
                  {!isComparing && ` (${activeYear})`}
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                  Countries with the highest happiness scores globally
                </p>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={topCountries}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 10]} />
                      <YAxis
                        dataKey="country"
                        type="category"
                        tick={{ fontSize: 12 }}
                        width={120}
                      />
                      <Tooltip 
                        formatter={(value) => value.toFixed(2)}
                        labelFormatter={(label, payload) => {
                          if (isComparing && payload && payload.length > 0) {
                            return `${label} (${payload[0].payload.year})`;
                          }
                          return label;
                        }}
                      />
                      <Legend />
                      <Bar
                        dataKey="score"
                        fill="#8884d8"
                        name="Happiness Score"
                      >
                        {topCountries.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={isComparing ? yearColors[entry.year] : colors[index % colors.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-1">
                  Bottom 10 Countries
                  {!isComparing && ` (${activeYear})`}
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                  Countries with the lowest happiness scores globally
                </p>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={bottomCountries}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 10]} />
                      <YAxis
                        dataKey="country"
                        type="category"
                        tick={{ fontSize: 12 }}
                        width={120}
                      />
                      <Tooltip 
                        formatter={(value) => value.toFixed(2)}
                        labelFormatter={(label, payload) => {
                          if (isComparing && payload && payload.length > 0) {
                            return `${label} (${payload[0].payload.year})`;
                          }
                          return label;
                        }}
                      />
                      <Legend />
                      <Bar
                        dataKey="score"
                        fill="#ff6361"
                        name="Happiness Score"
                      >
                        {bottomCountries.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={isComparing ? yearColors[entry.year] : colors[(9 - index) % colors.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                  <h2 className="text-xl font-semibold mb-1">Key Statistics</h2>
                  <p className="text-sm text-gray-500 mb-4">
                    Summary of global happiness metrics
                    {!isComparing && ` for ${activeYear}`}
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500">Highest Score</p>
                      <p className="text-2xl font-bold">
                        {Math.max(...combinedData.map((item) => item.score)).toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-700">
                        {combinedData.sort((a, b) => b.score - a.score)[0]?.country}
                        {isComparing && combinedData.length > 0 && ` (${combinedData.sort((a, b) => b.score - a.score)[0]?.year})`}
                      </p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500">Lowest Score</p>
                      <p className="text-2xl font-bold">
                        {Math.min(...combinedData.map((item) => item.score)).toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-700">
                        {combinedData.sort((a, b) => a.score - b.score)[0]?.country}
                        {isComparing && combinedData.length > 0 && ` (${combinedData.sort((a, b) => a.score - b.score)[0]?.year})`}
                      </p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500">Average Score</p>
                      <p className="text-2xl font-bold">
                        {(
                          combinedData.reduce((sum, item) => sum + item.score, 0) /
                          combinedData.length
                        ).toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500">
                        {isComparing ? "Total Data Points" : "Total Countries"}
                      </p>
                      <p className="text-2xl font-bold">{combinedData.length}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <h2 className="text-xl font-semibold mb-1">
                    Distribution of Happiness Scores
                    {!isComparing && ` (${activeYear})`}
                  </h2>
                  <p className="text-sm text-gray-500 mb-4">
                    Shows how happiness scores are distributed across all
                    countries
                  </p>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={[...combinedData]
                          .sort((a, b) => b.score - a.score)
                          .map((item, index) => ({ ...item, index }))}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="index"
                          label={{
                            value: "Country Rank",
                            position: "insideBottom",
                            offset: -5,
                          }}
                        />
                        <YAxis
                          domain={[0, 10]}
                          label={{
                            value: "Happiness Score",
                            angle: -90,
                            position: "insideLeft",
                          }}
                        />
                        <Tooltip
                          formatter={(value) => value.toFixed(2)}
                          labelFormatter={(index) => {
                            const item = combinedData.sort((a, b) => b.score - a.score)[index];
                            return item ? `${item.country}${isComparing ? ` (${item.year})` : ''}` : '';
                          }}
                        />
                        {isComparing ? (
                          selectedYears.map((year, idx) => (
                            <Line
                              key={year}
                              type="monotone"
                              dataKey="score"
                              data={[...yearData[year] || []]
                                .sort((a, b) => b.score - a.score)
                                .map((item, index) => ({ ...item, index }))}
                              stroke={yearColors[year]}
                              name={`${year} Scores`}
                              dot={false}
                            />
                          ))
                        ) : (
                          <Line
                            type="monotone"
                            dataKey="score"
                            stroke="#8884d8"
                            dot={false}
                            name={`${activeYear} Scores`}
                          />
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Factors Tab */}
          {activeTab === "factors" && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-1">
                  Average Factor Values
                  {!isComparing && ` (${activeYear})`}
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                  Comparison of average values for each happiness factor
                  globally
                </p>
                <div className="h-80">
                  {isComparing ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { name: "GDP", ...selectedYears.reduce((acc, year) => {
                            if (yearData[year]) {
                              acc[year] = yearData[year].reduce((sum, item) => sum + item.gdp, 0) / yearData[year].length;
                            }
                            return acc;
                          }, {}) },
                          { name: "Social Support", ...selectedYears.reduce((acc, year) => {
                            if (yearData[year]) {
                              acc[year] = yearData[year].reduce((sum, item) => sum + item.socialSupport, 0) / yearData[year].length;
                            }
                            return acc;
                          }, {}) },
                          { name: "Health", ...selectedYears.reduce((acc, year) => {
                            if (yearData[year]) {
                              acc[year] = yearData[year].reduce((sum, item) => sum + item.health, 0) / yearData[year].length;
                            }
                            return acc;
                          }, {}) },
                          { name: "Freedom", ...selectedYears.reduce((acc, year) => {
                            if (yearData[year]) {
                              acc[year] = yearData[year].reduce((sum, item) => sum + item.freedom, 0) / yearData[year].length;
                            }
                            return acc;
                          }, {}) },
                          { name: "Generosity", ...selectedYears.reduce((acc, year) => {
                            if (yearData[year]) {
                              acc[year] = yearData[year].reduce((sum, item) => sum + item.generosity, 0) / yearData[year].length;
                            }
                            return acc;
                          }, {}) },
                          { name: "Perception of Corruption", ...selectedYears.reduce((acc, year) => {
                            if (yearData[year]) {
                              acc[year] = yearData[year].reduce((sum, item) => sum + item.corruption, 0) / yearData[year].length;
                            }
                            return acc;
                          }, {}) },
                        ]}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value) => value?.toFixed(2) || "N/A"} />
                        <Legend />
                        {selectedYears.map((year) => (
                          <Bar 
                            key={year} 
                            dataKey={year} 
                            name={`${year} Average`} 
                            fill={yearColors[year]} 
                          />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          {
                            name: "GDP",
                            value:
                              data.reduce((sum, item) => sum + item.gdp, 0) /
                              data.length,
                          },
                          {
                            name: "Social Support",
                            value:
                              data.reduce(
                                (sum, item) => sum + item.socialSupport,
                                0
                              ) / data.length,
                          },
                          {
                            name: "Health",
                            value:
                              data.reduce((sum, item) => sum + item.health, 0) /
                              data.length,
                          },
                          {
                            name: "Freedom",
                            value:
                              data.reduce((sum, item) => sum + item.freedom, 0) /
                              data.length,
                          },
                          {
                            name: "Generosity",
                            value:
                              data.reduce(
                                (sum, item) => sum + item.generosity,
                                0
                              ) / data.length,
                          },
                          {
                            name: "Perception of Corruption",
                            value:
                              data.reduce(
                                (sum, item) => sum + item.corruption,
                                0
                              ) / data.length,
                          },
                        ]}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value) => value.toFixed(2)} />
                        <Legend />
                        <Bar dataKey="value" name="Average Value">
                          {[0, 1, 2, 3, 4, 5].map((index) => (
                            <Cell key={`cell-${index}`} fill={colors[index]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                  <h2 className="text-xl font-semibold mb-1">
                    GDP Impact on Happiness
                    {!isComparing && ` (${activeYear})`}
                  </h2>
                  <p className="text-sm text-gray-500 mb-4">
                    Relationship between GDP per capita and happiness scores
                  </p>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart
                        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                      >
                        <CartesianGrid />
                        <XAxis
                          type="number"
                          dataKey="gdp"
                          name="GDP per Capita"
                          label={{
                            value: "GDP per Capita",
                            position: "insideBottom",
                            offset: -5,
                          }}
                        />
                        <YAxis
                          type="number"
                          dataKey="score"
                          name="Happiness Score"
                          domain={[0, 10]}
                          label={{
                            value: "Happiness Score",
                            angle: -90,
                            position: "insideLeft",
                          }}
                        />
                        <Tooltip
                          cursor={{ strokeDasharray: "3 3" }}
                          formatter={(value) => value.toFixed(2)}
                          labelFormatter={(_, payload) => {
                            if (payload && payload.length > 0) {
                              return isComparing 
                                ? `${payload[0].payload.country} (${payload[0].payload.year})`
                                : payload[0].payload.country;
                            }
                            return "";
                          }}
                        />
                        {isComparing ? (
                          selectedYears.map(year => (
                            <Scatter 
                              key={year}
                              name={`${year} Data`} 
                              data={combinedData.filter(d => d.year === year)} 
                              fill={yearColors[year]} 
                            />
                          ))
                        ) : (
                          <Scatter name="Countries" data={data} fill="#8884d8" />
                        )}
                        <Legend />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <h2 className="text-xl font-semibold mb-1">
                    Social Support Impact
                    {!isComparing && ` (${activeYear})`}
                  </h2>
                  <p className="text-sm text-gray-500 mb-4">
                    Relationship between social support and happiness scores
                  </p>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart
                        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                      >
                        <CartesianGrid />
                        <XAxis
                          type="number"
                          dataKey="socialSupport"
                          name="Social Support"
                          domain={[0, "dataMax"]}
                          label={{
                            value: "Social Support",
                            position: "insideBottom",
                            offset: -5,
                          }}
                        />
                        <YAxis
                          type="number"
                          dataKey="score"
                          name="Happiness Score"
                          domain={[0, 10]}
                          label={{
                            value: "Happiness Score",
                            angle: -90,
                            position: "insideLeft",
                          }}
                        />
                        <Tooltip
                          cursor={{ strokeDasharray: "3 3" }}
                          formatter={(value) => value.toFixed(2)}
                          labelFormatter={(_, payload) => {
                            if (payload && payload.length > 0) {
                              return isComparing 
                                ? `${payload[0].payload.country} (${payload[0].payload.year})`
                                : payload[0].payload.country;
                            }
                            return "";
                          }}
                        />
                        {isComparing ? (
                          selectedYears.map(year => (
                            <Scatter 
                              key={year}
                              name={`${year} Data`} 
                              data={combinedData.filter(d => d.year === year)} 
                              fill={yearColors[year]} 
                            />
                          ))
                        ) : (
                          <Scatter name="Countries" data={data} fill="#82ca9d" />
                        )}
                        <Legend />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Country Comparison Tab */}
          {activeTab === "comparison" && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-1">
                  Country Comparison
                  {!isComparing && ` (${activeYear})`}
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                  Select up to 5 countries to compare their happiness factors
                </p>

                <div className="mb-6">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {selectedCountries.map((country) => (
                      <span
                        key={country}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                      >
                        {country}
                        <button
                          type="button"
                          className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full text-blue-400 hover:text-blue-600 focus:outline-none"
                          onClick={() => toggleCountrySelection(country)}
                        >
                          <span className="sr-only">Remove</span>
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="max-h-40 overflow-y-auto border rounded-md">
                    <ul className="divide-y divide-gray-200">
                      {combinedData
                        .filter((item, index, self) => 
                          index === self.findIndex(t => t.country === item.country)
                        )
                        .sort((a, b) => a.country.localeCompare(b.country))
                        .map((country) => (
                        <li
                          key={country.country}
                          className={`px-4 py-2 hover:bg-gray-50 cursor-pointer ${
                            selectedCountries.includes(country.country)
                              ? "bg-blue-50"
                              : ""
                          }`}
                          onClick={() =>
                            toggleCountrySelection(country.country)
                          }
                        >
                          {country.country}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {selectedCountries.length > 0 ? (
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart outerRadius={150} data={radarData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="factor" />
                        <PolarRadiusAxis angle={30} domain={[0, 2]} />
                        {isComparing ? (
                          // For comparison mode, include data for each country and year
                          selectedCountries.flatMap(country => 
                            selectedYears.map(year => {
                              const key = `${country} (${year})`;
                              const colorIndex = (selectedCountries.indexOf(country) * selectedYears.length + selectedYears.indexOf(year)) % colors.length;
                              return (
                                <Radar
                                  key={key}
                                  name={key}
                                  dataKey={key}
                                  stroke={colors[colorIndex]}
                                  fill={colors[colorIndex]}
                                  fillOpacity={0.2}
                                />
                              );
                            })
                          )
                        ) : (
                          // For single year mode
                          selectedCountries.map((country, index) => (
                            <Radar
                              key={country}
                              name={country}
                              dataKey={country}
                              stroke={colors[index % colors.length]}
                              fill={colors[index % colors.length]}
                              fillOpacity={0.2}
                            />
                          ))
                        )}
                        <Legend />
                        <Tooltip
                          formatter={(value) => value?.toFixed(2) || "N/A"}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">Select countries to compare</p>
                  </div>
                )}
              </div>

              {selectedCountries.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow">
                  <h2 className="text-xl font-semibold mb-1">
                    Happiness Score Comparison
                  </h2>
                  <p className="text-sm text-gray-500 mb-4">
                    Direct comparison of happiness scores between selected
                    countries
                  </p>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      {isComparing ? (
                        <BarChart
                          data={selectedCountries.flatMap(country => 
                            selectedYears.map(year => {
                              const countryData = yearData[year]?.find(item => item.country === country);
                              return {
                                country,
                                year,
                                score: countryData?.score || 0,
                                label: `${country} (${year})`
                              };
                            })
                          )}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="label" angle={-45} textAnchor="end" height={80} />
                          <YAxis domain={[0, 10]} />
                          <Tooltip formatter={(value) => value.toFixed(2)} />
                          <Legend />
                          <Bar dataKey="score" name="Happiness Score">
                            {selectedCountries.flatMap(country => 
                              selectedYears.map((year, yearIndex) => {
                                const countryIndex = selectedCountries.indexOf(country);
                                const colorIndex = (countryIndex * selectedYears.length + yearIndex) % colors.length;
                                return <Cell key={`${country}-${year}`} fill={colors[colorIndex]} />;
                              })
                            )}
                          </Bar>
                        </BarChart>
                      ) : (
                        <BarChart
                          data={selectedCountries.map((country) => {
                            const countryData = data.find(
                              (item) => item.country === country
                            );
                            return {
                              country,
                              score: countryData?.score || 0,
                            };
                          })}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="country" />
                          <YAxis domain={[0, 10]} />
                          <Tooltip formatter={(value) => value.toFixed(2)} />
                          <Legend />
                          <Bar dataKey="score" name="Happiness Score">
                            {selectedCountries.map((_, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={colors[index % colors.length]}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Correlation Tab */}
          {activeTab === "correlation" && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-1">
                  GDP vs. Happiness Score
                  {!isComparing && ` (${activeYear})`}
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                  Scatter plot showing relationship between economic prosperity
                  and happiness
                </p>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart
                      margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                    >
                      <CartesianGrid />
                      <XAxis
                        type="number"
                        dataKey="gdp"
                        name="GDP per Capita"
                        label={{
                          value: "GDP per Capita",
                          position: "insideBottom",
                          offset: -5,
                        }}
                      />
                      <YAxis
                        type="number"
                        dataKey="score"
                        name="Happiness Score"
                        domain={[0, 10]}
                        label={{
                          value: "Happiness Score",
                          angle: -90,
                          position: "insideLeft",
                        }}
                      />
                      <Tooltip
                        cursor={{ strokeDasharray: "3 3" }}
                        formatter={(value) => value.toFixed(2)}
                        labelFormatter={(_, payload) => {
                          if (payload && payload.length > 0) {
                            return isComparing 
                              ? `${payload[0].payload.country} (${payload[0].payload.year})`
                              : payload[0].payload.country;
                          }
                          return "";
                        }}
                      />
                      {isComparing ? (
                        selectedYears.map(year => (
                          <Scatter 
                            key={year}
                            name={`${year} Data`} 
                            data={combinedData.filter(d => d.year === year)} 
                            fill={yearColors[year]} 
                          />
                        ))
                      ) : (
                        <Scatter name="Countries" data={combinedData} fill="#8884d8" />
                      )}
                      <Legend />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-gray-600">
                    This scatter plot shows the relationship between GDP per
                    Capita and Happiness Score. There is generally a positive
                    correlation, suggesting that economic prosperity contributes
                    to happiness, but it's not the only factor.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                  <h2 className="text-xl font-semibold mb-1">
                    Freedom vs. Happiness
                    {!isComparing && ` (${activeYear})`}
                  </h2>
                  <p className="text-sm text-gray-500 mb-4">
                    Impact of freedom to make life choices on happiness
                  </p>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart
                        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                      >
                        <CartesianGrid />
                        <XAxis
                          type="number"
                          dataKey="freedom"
                          name="Freedom"
                          domain={[0, "dataMax"]}
                          label={{
                            value: "Freedom to Make Life Choices",
                            position: "insideBottom",
                            offset: -5,
                          }}
                        />
                        <YAxis
                          type="number"
                          dataKey="score"
                          name="Happiness Score"
                          domain={[0, 10]}
                          label={{
                            value: "Happiness Score",
                            angle: -90,
                            position: "insideLeft",
                          }}
                        />
                        <Tooltip
                          cursor={{ strokeDasharray: "3 3" }}
                          formatter={(value) => value.toFixed(2)}
                          labelFormatter={(_, payload) => {
                            if (payload && payload.length > 0) {
                              return isComparing 
                                ? `${payload[0].payload.country} (${payload[0].payload.year})`
                                : payload[0].payload.country;
                            }
                            return "";
                          }}
                        />
                        {isComparing ? (
                          selectedYears.map(year => (
                            <Scatter 
                              key={year}
                              name={`${year} Data`} 
                              data={combinedData.filter(d => d.year === year)} 
                              fill={yearColors[year]} 
                            />
                          ))
                        ) : (
                          <Scatter name="Countries" data={data} fill="#ffc658" />
                        )}
                        <Legend />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <h2 className="text-xl font-semibold mb-1">
                    Health vs. Happiness
                    {!isComparing && ` (${activeYear})`}
                  </h2>
                  <p className="text-sm text-gray-500 mb-4">
                    Relationship between healthy life expectancy and happiness
                  </p>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart
                        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                      >
                        <CartesianGrid />
                        <XAxis
                          type="number"
                          dataKey="health"
                          name="Health"
                          domain={[0, "dataMax"]}
                          label={{
                            value: "Healthy Life Expectancy",
                            position: "insideBottom",
                            offset: -5,
                          }}
                        />
                        <YAxis
                          type="number"
                          dataKey="score"
                          name="Happiness Score"
                          domain={[0, 10]}
                          label={{
                            value: "Happiness Score",
                            angle: -90,
                            position: "insideLeft",
                          }}
                        />
                        <Tooltip
                          cursor={{ strokeDasharray: "3 3" }}
                          formatter={(value) => value.toFixed(2)}
                          labelFormatter={(_, payload) => {
                            if (payload && payload.length > 0) {
                              return isComparing 
                                ? `${payload[0].payload.country} (${payload[0].payload.year})`
                                : payload[0].payload.country;
                            }
                            return "";
                          }}
                        />
                        {isComparing ? (
                          selectedYears.map(year => (
                            <Scatter 
                              key={year}
                              name={`${year} Data`} 
                              data={combinedData.filter(d => d.year === year)} 
                              fill={yearColors[year]} 
                            />
                          ))
                        ) : (
                          <Scatter name="Countries" data={data} fill="#82ca9d" />
                        )}
                        <Legend />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-1">
                  Correlation Analysis
                  {!isComparing && ` (${activeYear})`}
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                  Strength of relationship between each factor and overall
                  happiness
                </p>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    {isComparing ? (
                      <BarChart
                        data={[
                          {
                            factor: "GDP",
                            ...selectedYears.reduce((acc, year) => {
                              if (yearData[year] && yearData[year].length > 0) {
                                acc[year] = calculateCorrelation(
                                  yearData[year].map((d) => d.gdp),
                                  yearData[year].map((d) => d.score)
                                );
                              }
                              return acc;
                            }, {})
                          },
                          {
                            factor: "Social Support",
                            ...selectedYears.reduce((acc, year) => {
                              if (yearData[year] && yearData[year].length > 0) {
                                acc[year] = calculateCorrelation(
                                  yearData[year].map((d) => d.socialSupport),
                                  yearData[year].map((d) => d.score)
                                );
                              }
                              return acc;
                            }, {})
                          },
                          {
                            factor: "Health",
                            ...selectedYears.reduce((acc, year) => {
                              if (yearData[year] && yearData[year].length > 0) {
                                acc[year] = calculateCorrelation(
                                  yearData[year].map((d) => d.health),
                                  yearData[year].map((d) => d.score)
                                );
                              }
                              return acc;
                            }, {})
                          },
                          {
                            factor: "Freedom",
                            ...selectedYears.reduce((acc, year) => {
                              if (yearData[year] && yearData[year].length > 0) {
                                acc[year] = calculateCorrelation(
                                  yearData[year].map((d) => d.freedom),
                                  yearData[year].map((d) => d.score)
                                );
                              }
                              return acc;
                            }, {})
                          },
                          {
                            factor: "Generosity",
                            ...selectedYears.reduce((acc, year) => {
                              if (yearData[year] && yearData[year].length > 0) {
                                acc[year] = calculateCorrelation(
                                  yearData[year].map((d) => d.generosity),
                                  yearData[year].map((d) => d.score)
                                );
                              }
                              return acc;
                            }, {})
                          },
                          {
                            factor: "Perception of Corruption",
                            ...selectedYears.reduce((acc, year) => {
                              if (yearData[year] && yearData[year].length > 0) {
                                acc[year] = calculateCorrelation(
                                  yearData[year].map((d) => d.corruption),
                                  yearData[year].map((d) => d.score)
                                );
                              }
                              return acc;
                            }, {})
                          },
                        ]}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="factor" />
                        <YAxis domain={[-1, 1]} />
                        <Tooltip formatter={(value) => value?.toFixed(2) || "N/A"} />
                        <Legend />
                        {selectedYears.map(year => (
                          <Bar 
                            key={year} 
                            dataKey={year} 
                            name={`${year} Correlation`} 
                            fill={yearColors[year]} 
                          />
                        ))}
                      </BarChart>
                    ) : (
                      <BarChart
                        data={[
                          {
                            factor: "GDP",
                            correlation: calculateCorrelation(
                              data.map((d) => d.gdp),
                              data.map((d) => d.score)
                            ),
                          },
                          {
                            factor: "Social Support",
                            correlation: calculateCorrelation(
                              data.map((d) => d.socialSupport),
                              data.map((d) => d.score)
                            ),
                          },
                          {
                            factor: "Health",
                            correlation: calculateCorrelation(
                              data.map((d) => d.health),
                              data.map((d) => d.score)
                            ),
                          },
                          {
                            factor: "Freedom",
                            correlation: calculateCorrelation(
                              data.map((d) => d.freedom),
                              data.map((d) => d.score)
                            ),
                          },
                          {
                            factor: "Generosity",
                            correlation: calculateCorrelation(
                              data.map((d) => d.generosity),
                              data.map((d) => d.score)
                            ),
                          },
                          {
                            factor: "Perception of Corruption",
                            correlation: calculateCorrelation(
                              data.map((d) => d.corruption),
                              data.map((d) => d.score)
                            ),
                          },
                        ]}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="factor" />
                        <YAxis domain={[-1, 1]} />
                        <Tooltip formatter={(value) => value.toFixed(2)} />
                        <Legend />
                        <Bar
                          dataKey="correlation"
                          name="Correlation with Happiness"
                        >
                          {[0, 1, 2, 3, 4, 5].map((index) => (
                            <Cell key={`cell-${index}`} fill={colors[index]} />
                          ))}
                        </Bar>
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-gray-600">
                    Correlation values range from -1 to 1. Values closer to 1
                    indicate a strong positive correlation, values closer to -1
                    indicate a strong negative correlation, and values near 0
                    indicate little to no correlation.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Trends Over Time Tab */}
          {activeTab === "trends" && (
            <>
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-1">
                  Global Happiness Trends
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                  Average happiness score across all countries by year
                </p>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={averageScoreByYear}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" />
                        <YAxis domain={[0, 10]} />
                        <Tooltip formatter={(value) => value.toFixed(2)} />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="score"
                          stroke="#8884d8"
                          name="Average Happiness Score"
                          strokeWidth={2}
                          dot={{ r: 6 }}
                          activeDot={{ r: 8 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              {selectedCountries.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow">
                  <h2 className="text-xl font-semibold mb-1">
                    Country Happiness Trends
                  </h2>
                  <p className="text-sm text-gray-500 mb-4">
                    Happiness score trends for selected countries over time
                  </p>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="year" 
                          type="category"
                          allowDuplicatedCategory={false}
                        />
                        <YAxis domain={[0, 10]} />
                        <Tooltip formatter={(value) => value.toFixed(2)} />
                        <Legend />
                        {selectedCountries.map((country, index) => {
                          const countryData = trendData.filter(d => d.country === country);
                          return (
                            <Line
                              key={country}
                              data={countryData}
                              type="monotone"
                              dataKey="score"
                              name={country}
                              stroke={colors[index % colors.length]}
                              strokeWidth={2}
                              dot={{ r: 5 }}
                              activeDot={{ r: 7 }}
                            />
                          );
                        })}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                  <h2 className="text-xl font-semibold mb-1">
                    GDP Factor Trends
                  </h2>
                  <p className="text-sm text-gray-500 mb-4">
                    How GDP contribution to happiness has changed over time
                  </p>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart
                        data={availableYears.map(year => {
                          if (yearData[year] && yearData[year].length > 0) {
                            return {
                              year,
                              avgGDP: yearData[year].reduce((sum, item) => sum + item.gdp, 0) / yearData[year].length,
                              correlation: calculateCorrelation(
                                yearData[year].map(d => d.gdp),
                                yearData[year].map(d => d.score)
                              )
                            };
                          }
                          return { year, avgGDP: 0, correlation: 0 };
                        })}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" domain={[-1, 1]} />
                        <Tooltip formatter={(value) => value.toFixed(2)} />
                        <Legend />
                        <Bar yAxisId="left" dataKey="avgGDP" name="Average GDP Factor" fill="#8884d8" />
                        <Line yAxisId="right" type="monotone" dataKey="correlation" name="Correlation with Happiness" stroke="#ff7300" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <h2 className="text-xl font-semibold mb-1">
                    Social Support Trends
                  </h2>
                  <p className="text-sm text-gray-500 mb-4">
                    How social support contribution to happiness has changed over time
                  </p>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart
                        data={availableYears.map(year => {
                          if (yearData[year] && yearData[year].length > 0) {
                            return {
                              year,
                              avgSupport: yearData[year].reduce((sum, item) => sum + item.socialSupport, 0) / yearData[year].length,
                              correlation: calculateCorrelation(
                                yearData[year].map(d => d.socialSupport),
                                yearData[year].map(d => d.score)
                              )
                            };
                          }
                          return { year, avgSupport: 0, correlation: 0 };
                        })}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" domain={[-1, 1]} />
                        <Tooltip formatter={(value) => value.toFixed(2)} />
                        <Legend />
                        <Bar yAxisId="left" dataKey="avgSupport" name="Average Social Support" fill="#82ca9d" />
                        <Line yAxisId="right" type="monotone" dataKey="correlation" name="Correlation with Happiness" stroke="#ff7300" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {selectedCountries.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow">
                  <h2 className="text-xl font-semibold mb-1">
                    Factor Evolution for Selected Countries
                  </h2>
                  <p className="text-sm text-gray-500 mb-4">
                    How different happiness factors have evolved for selected countries
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {selectedCountries.map((country, index) => (
                      <div key={country} className="h-80">
                        <h3 className="text-lg font-medium mb-2">{country}</h3>
                        <ResponsiveContainer width="100%" height="90%">
                          <RadarChart 
                            outerRadius={90} 
                            data={availableYears.map(year => {
                              const countryData = yearData[year]?.find(item => item.country === country);
                              if (countryData) {
                                return {
                                  year,
                                  GDP: countryData.gdp,
                                  "Social Support": countryData.socialSupport,
                                  Health: countryData.health,
                                  Freedom: countryData.freedom,
                                  Generosity: countryData.generosity,
                                  "Corruption": countryData.corruption,
                                };
                              }
                              return { year };
                            })}
                          >
                            <PolarGrid />
                            <PolarAngleAxis dataKey="year" />
                            <PolarRadiusAxis angle={30} domain={[0, 2]} />
                            <Radar name="GDP" dataKey="GDP" stroke="#8884d8" fill="#8884d8" fillOpacity={0.2} />
                            <Radar name="Social Support" dataKey="Social Support" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.2} />
                            <Radar name="Health" dataKey="Health" stroke="#ffc658" fill="#ffc658" fillOpacity={0.2} />
                            <Radar name="Freedom" dataKey="Freedom" stroke="#ff8042" fill="#ff8042" fillOpacity={0.2} />
                            <Radar name="Generosity" dataKey="Generosity" stroke="#ff6361" fill="#ff6361" fillOpacity={0.2} />
                            <Radar name="Corruption" dataKey="Corruption" stroke="#bc5090" fill="#bc5090" fillOpacity={0.2} />
                            <Legend />
                            <Tooltip formatter={(value) => value?.toFixed(2) || "N/A"} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            </>
          )}
        </div>
      </main>
      <div className="block lg:hidden max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* This div is visible only on mobile devices */}
        <p className="px-4 text-base text-gray-700">Please view this on laptop/desktop screens for best experience.</p>
      </div>
      {/* Footer */}
      <footer className="bg-white shadow mt-8">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            Data source: World Happiness Report (2020-2024) |  <a href="https://www.kaggle.com/datasets/samithsachidanandan/world-happiness-report-2020-2024" target="__blank" className="underline">Kaggle</a> | <a href="https://worldhappiness.report/" target="__blank" className="underline">Report</a>
          </p>
          <p className="text-center text-sm text-gray-500">
            Made by <a href="https://www.suryaanshrathinam.com/" className="underline" target="__blank">Suryaansh Rathinam</a>
          </p>
        </div>
      </footer>
    </div>
  );
}

// Helper function to calculate correlation coefficient
function calculateCorrelation(x, y) {
  const n = x.length;
  if (n === 0) return 0;

  // Filter out any NaN values
  const validPairs = [];
  for (let i = 0; i < n; i++) {
    if (!isNaN(x[i]) && !isNaN(y[i])) {
      validPairs.push([x[i], y[i]]);
    }
  }

  if (validPairs.length < 2) return 0;

  const xValues = validPairs.map((pair) => pair[0]);
  const yValues = validPairs.map((pair) => pair[1]);

  // Calculate means
  const xMean = xValues.reduce((sum, val) => sum + val, 0) / xValues.length;
  const yMean = yValues.reduce((sum, val) => sum + val, 0) / yValues.length;

  // Calculate correlation coefficient
  let numerator = 0;
  let xDenominator = 0;
  let yDenominator = 0;

  for (let i = 0; i < xValues.length; i++) {
    const xDiff = xValues[i] - xMean;
    const yDiff = yValues[i] - yMean;
    numerator += xDiff * yDiff;
    xDenominator += xDiff * xDiff;
    yDenominator += yDiff * yDiff;
  }

  if (xDenominator === 0 || yDenominator === 0) return 0;

  return numerator / Math.sqrt(xDenominator * yDenominator);
}