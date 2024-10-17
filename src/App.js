import React, { useState, useEffect } from "react";
import "./App.css";
import RoutesList from "./component/RoutesList";
import BusStops from "./component/BusStops";

const fetchWithRetry = async (url, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) return response;
    } catch (error) {
      if (i === retries - 1) throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  throw new Error(`Failed after ${retries} retries`);
};

function App() {
  const [routes, setRoutes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredRoutes, setFilteredRoutes] = useState([]);
  const [clickedRoute, setClickedRoute] = useState(null);
  const [selectedBound, setSelectedBound] = useState(null);
  const [error, setError] = useState("");
  const [routeDetails, setRouteDetails] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchRoutes();
  }, []);

  useEffect(() => {
    setFilteredRoutes(
      routes.filter((route) =>
        route.route.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [routes, searchTerm]);

  const fetchRoutes = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        "https://data.etabus.gov.hk/v1/transport/kmb/route/"
      );
      const data = await response.json();
      setRoutes(data.data);
      setError("");
      setIsLoading(false);
    } catch (err) {
      console.error("Failed to fetch routes:", err);
      setError("Failed to fetch routes. Please try again later.");
      setIsLoading(false);
    }
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleRouteClick = (route) => {
    setClickedRoute(route);
    setSelectedBound(route.bound);
    fetchRouteDetails(route);
    fetchRouteInfo(route);
  };

  const handleReturn = () => {
    setClickedRoute(null);
    setSelectedBound(null);
    setRouteDetails(null);
  };

  const fetchRouteDetails = async (route) => {
    try {
      setIsLoading(true);
      const bounds = ["outbound", "inbound"];
      let data;

      for (const bound of bounds) {
        try {
          const response = await fetch(
            `https://data.etabus.gov.hk/v1/transport/kmb/route-stop/${route.route}/${bound}/${route.service_type}`
          );
          if (response.ok) {
            data = await response.json();
            break;
          }
        } catch (error) {
          console.error(`Failed to fetch ${bound} route details:`, error);
        }
      }

      if (data) {
        setRouteDetails(data.data);
        setSelectedBound(data.data[0].bound);
        setError("");
      } else {
        throw new Error("Failed to fetch route details for both bounds");
      }
      setIsLoading(false);
    } catch (err) {
      console.error("Failed to fetch route details:", err);
      setError("Failed to fetch route details. Please try again.");
      setRouteDetails(null);
      setIsLoading(false);
    }
  };

  const handleBoundChange = (newBound) => {
    if (clickedRoute) {
      const updatedBound = newBound === "outbound" ? "outbound" : "inbound";
      setSelectedBound(updatedBound);
      fetchRouteDetails({ ...clickedRoute, bound: updatedBound });
    }
  };

  const fetchRouteInfo = async (route) => {
    try {
      setIsLoading(true);
      const bounds = ["inbound", "outbound"];
      let data;

      for (const bound of bounds) {
        try {
          const response = await fetch(
            `https://data.etabus.gov.hk/v1/transport/kmb/route/${route.route}/${bound}/${route.service_type}`
          );
          if (response.ok) {
            data = await response.json();
            break;
          }
        } catch (error) {
          console.error(`Failed to fetch ${bound} route info:`, error);
        }
      }

      if (data) {
        // Instead of setting state, log the route information to the console
        console.log("Route Information:", data.data);
      } else {
        throw new Error("Failed to fetch route info for both bounds");
      }
      setIsLoading(false);
    } catch (err) {
      console.error("Failed to fetch route info:", err);
      setError("Failed to fetch route info. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="App">
      <div className="header-container">
        <div className="logo-container">
          <img
            src="https://th.bing.com/th/id/R.cf48d31b50862bfaf0fccf16ef39f5e6?rik=USYJfKTlQqaNIw&pid=ImgRaw&r=0"
            alt="KMB Logo"
          />
        </div>
        <div className="search-container">
          <input
            type="text"
            placeholder="輸入你的巴士路線號碼"
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
      </div>
      {error && <p className="error">{error}</p>}
      {filteredRoutes.length === 0 ? (
        <>
          <p>沒有你要搜尋的路線</p>
          <p>請重新輸入路線需要的數字或數字字母組合</p>
          <p>數字:1-9</p>
          <p>字母:A,B,C,D,E,H,I,K,M,N,P,R,S,T,W,X</p>
        </>
      ) : (
        !clickedRoute && (
          <RoutesList
            filteredRoutes={filteredRoutes}
            handleRouteClick={handleRouteClick}
          />
        )
      )}
      {clickedRoute && (
        <div>
          <div id="returnBtn">
            <button onClick={handleReturn} className="return-button">
              返回
            </button>
          </div>
          <div>
            <h2>已選擇路線資訊:</h2>
            <p>
              路線號碼: {clickedRoute.route} 由 {clickedRoute.orig_tc} 前往{" "}
              {clickedRoute.dest_tc}
            </p>
          </div>
          <div>
            {clickedRoute && ( //refresh btn
              <button onClick={() => fetchRouteDetails(clickedRoute)}></button>
            )}
          </div>
          <div>
            {routeDetails && (
              <BusStops routeDetails={routeDetails} route={clickedRoute} />
            )}
          </div>
        </div>
      )}
      {isLoading && <p>Loading...</p>}
    </div>
  );
}

export default App;
