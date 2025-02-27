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
} from "recharts";
import Papa from "papaparse";

export default function HappinessDashboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");

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

  // Fetch and parse CSV data
  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(
          "/data.csv"
        );
        const csvText = await response.text();

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
              }));

            setData(cleanedData);
            setLoading(false);
          },
          error: (error) => {
            setError(error.message);
            setLoading(false);
          },
        });
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Get top 10 happiest countries
  const topCountries = useMemo(() => {
    return [...data].sort((a, b) => b.score - a.score).slice(0, 10);
  }, [data]);

  // Get bottom 10 least happy countries
  const bottomCountries = useMemo(() => {
    return [...data].sort((a, b) => a.score - b.score).slice(0, 10);
  }, [data]);

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
      selectedCountries.forEach((country) => {
        const countryData = data.find((item) => item.country === country);
        if (countryData) {
          factorData[country] = countryData[factor];
        }
      });
      return factorData;
    });
  }, [data, selectedCountries]);

  // Prepare data for scatter plot
  const scatterData = useMemo(() => {
    return data.map((item) => ({
      x: item.gdp,
      y: item.score,
      country: item.country,
      z: item.rank,
    }));
  }, [data]);

  // Handle country selection
  const toggleCountrySelection = (country) => {
    setSelectedCountries(
      (prev) =>
        prev.includes(country)
          ? prev.filter((c) => c !== country)
          : [...prev, country].slice(0, 5) // Limit to 5 countries
    );
  };

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
            </nav>
          </div>
        </div>

        {/* Dashboard content */}
        <div className="space-y-6">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-1">
                  Top 10 Happiest Countries
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
                      <Tooltip formatter={(value) => value.toFixed(2)} />
                      <Legend />
                      <Bar
                        dataKey="score"
                        fill="#8884d8"
                        name="Happiness Score"
                      >
                        {topCountries.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={colors[index % colors.length]}
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
                      <Tooltip formatter={(value) => value.toFixed(2)} />
                      <Legend />
                      <Bar
                        dataKey="score"
                        fill="#ff6361"
                        name="Happiness Score"
                      >
                        {bottomCountries.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={colors[(9 - index) % colors.length]}
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
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500">Highest Score</p>
                      <p className="text-2xl font-bold">
                        {Math.max(...data.map((item) => item.score)).toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-700">
                        {data.sort((a, b) => b.score - a.score)[0]?.country}
                      </p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500">Lowest Score</p>
                      <p className="text-2xl font-bold">
                        {Math.min(...data.map((item) => item.score)).toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-700">
                        {data.sort((a, b) => a.score - b.score)[0]?.country}
                      </p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500">Average Score</p>
                      <p className="text-2xl font-bold">
                        {(
                          data.reduce((sum, item) => sum + item.score, 0) /
                          data.length
                        ).toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500">Total Countries</p>
                      <p className="text-2xl font-bold">{data.length}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <h2 className="text-xl font-semibold mb-1">
                    Distribution of Happiness Scores
                  </h2>
                  <p className="text-sm text-gray-500 mb-4">
                    Shows how happiness scores are distributed across all
                    countries
                  </p>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={[...data]
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
                          labelFormatter={(index) =>
                            data.sort((a, b) => b.score - a.score)[index]
                              ?.country
                          }
                        />
                        <Line
                          type="monotone"
                          dataKey="score"
                          stroke="#8884d8"
                          dot={false}
                        />
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
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                  Comparison of average values for each happiness factor
                  globally
                </p>
                <div className="h-80">
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
                          name: "Low Corruption",
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
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                  <h2 className="text-xl font-semibold mb-1">
                    GDP Impact on Happiness
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
                          labelFormatter={(_, payload) =>
                            payload[0]?.payload?.country
                          }
                        />
                        <Scatter name="Countries" data={data} fill="#8884d8" />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <h2 className="text-xl font-semibold mb-1">
                    Social Support Impact
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
                          labelFormatter={(_, payload) =>
                            payload[0]?.payload?.country
                          }
                        />
                        <Scatter name="Countries" data={data} fill="#82ca9d" />
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
                      {data.map((country) => (
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
                          {country.country} - Score: {country.score.toFixed(2)}
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
                        {selectedCountries.map((country, index) => (
                          <Radar
                            key={country}
                            name={country}
                            dataKey={country}
                            stroke={colors[index % colors.length]}
                            fill={colors[index % colors.length]}
                            fillOpacity={0.2}
                          />
                        ))}
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
                        dataKey="x"
                        name="GDP per Capita"
                        label={{
                          value: "GDP per Capita",
                          position: "insideBottom",
                          offset: -5,
                        }}
                      />
                      <YAxis
                        type="number"
                        dataKey="y"
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
                        labelFormatter={(_, payload) =>
                          payload[0]?.payload?.country
                        }
                      />
                      <Scatter
                        name="Countries"
                        data={scatterData}
                        fill="#8884d8"
                      />
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
                          labelFormatter={(_, payload) =>
                            payload[0]?.payload?.country
                          }
                        />
                        <Scatter name="Countries" data={data} fill="#ffc658" />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <h2 className="text-xl font-semibold mb-1">
                    Health vs. Happiness
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
                          labelFormatter={(_, payload) =>
                            payload[0]?.payload?.country
                          }
                        />
                        <Scatter name="Countries" data={data} fill="#82ca9d" />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-1">
                  Correlation Analysis
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                  Strength of relationship between each factor and overall
                  happiness
                </p>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
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
                          factor: "Low Corruption",
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
