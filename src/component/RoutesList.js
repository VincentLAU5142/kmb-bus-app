import React from "react";

const RoutesList = ({ filteredRoutes, handleRouteClick }) => {
  return (
    <ul className="route-list" style={{ listStyleType: "none" }}>
      {filteredRoutes.map((route) => (
        <li key={`${route.route}-${route.bound}-${route.service_type}`}>
          <button onClick={() => handleRouteClick(route)}>
            路線 {route.route}: {route.orig_tc} 往 {route.dest_tc}
          </button>
        </li>
      ))}
    </ul>
  );
};

export default RoutesList;
