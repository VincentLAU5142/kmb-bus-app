import React, { useState, useEffect } from "react";

const BusStops = ({ routeDetails, route }) => {
  const [stops, setStops] = useState([]);
  const [etaData, setEtaData] = useState({});
  const [error, setError] = useState("");

  useEffect(() => {
    if (routeDetails && routeDetails.length > 0 && route) {
      fetchStops();
      fetchETA();
    }
  }, [routeDetails, route]);

  const fetchStops = async () => {
    try {
      const stopPromises = routeDetails.map(async (stopDetail) => {
        const response = await fetch(
          `https://data.etabus.gov.hk/v1/transport/kmb/stop/${stopDetail.stop}`
        );

        if (!response.ok) {
          throw new Error(`Error fetching stop: ${response.statusText}`);
        }

        const data = await response.json();
        return data.data;
      });

      const stopsData = await Promise.all(stopPromises);
      setStops(stopsData);
      setError("");
    } catch (error) {
      console.error("Failed to fetch stops:", error);
      setError("Failed to fetch stops. Please try again.");
    }
  };

  const fetchETA = async () => {
    try {
      const etaPromises = routeDetails.map(async (stopDetail) => {
        try {
          const response = await fetch(
            `https://data.etabus.gov.hk/v1/transport/kmb/eta/${stopDetail.stop}/${route.route}/${route.service_type}`
          );

          if (!response.ok) {
            throw new Error(`Error fetching ETA: ${response.statusText}`);
          }

          const data = await response.json();
          return { stop: stopDetail.stop, eta: data.data };
        } catch (error) {
          console.error(
            `Failed to fetch ETA for stop ${stopDetail.stop}:`,
            error
          );
          return { stop: stopDetail.stop, eta: [] };
        }
      });

      const etaData = await Promise.all(etaPromises);
      const etaObject = etaData.reduce((acc, curr) => {
        acc[curr.stop] = curr.eta;
        return acc;
      }, {});
      setEtaData(etaObject);
    } catch (error) {
      console.error("Failed to fetch ETA:", error);
      setError("Failed to fetch ETA. Please try again.");
    }
  };

  const getClosestETA = (etaList) => {
    if (!etaList || etaList.length === 0) return null;
    return etaList.reduce((closest, current) => {
      if (!closest) return current;
      return new Date(current.eta) < new Date(closest.eta) ? current : closest;
    }, null);
  };

  const handleRefresh = () => {
    fetchETA();
  };

  if (!routeDetails || routeDetails.length === 0) {
    return <p>No stop information available.</p>;
  }

  if (error) {
    return <p className="error">{error}</p>;
  }

  if (!stops.length) {
    return <p>Loading stops...</p>;
  }

  return (
    <div>
      <button onClick={handleRefresh} className="refresh-button">
        刷新到站時間
      </button>
      <div className="bus-stops-container">
        {stops.map((stop, index) => {
          const closestETA = getClosestETA(etaData[stop.stop]);
          return (
            <div className="bus-stop" key={stop.stop}>
              <h3>
                {index + 1}. {stop.name_tc} ({stop.name_en})
              </h3>
              {closestETA ? (
                <p>
                  預計到達時間 {new Date(closestETA.eta).toLocaleTimeString()}{" "}
                  (還有{closestETA.eta_seq} 分鐘到達)
                </p>
              ) : (
                <p>No ETA available</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BusStops;
