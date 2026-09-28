# Fleet & Tracking update

## How to run
1. Open this folder in VS Code.
2. Open a terminal (Terminal > New Terminal) and run `npm install` (needed once — this also installs the new `leaflet` map library).
3. Run `npm run dev` and open the address shown (usually http://localhost:5173).

## What changed
- Fleet & Tracking now has two sub-pages (also shown in the sidebar):
  - **Vehicle Information** (`/fleet/vehicles`): vehicle details, fuel information,
    maintenance information and inspection summary, plus a health score and condition
    (Good / Fair / Needs attention / In workshop) for every vehicle.
    - **Register vehicle** adds a vehicle with its category (van or lorry, reefer or ambient),
      depot and brand. New vehicles also appear in the Dispatch page vehicle list.
    - **Record service** and **Record fuel fill** add maintenance and fuel entries.
  - **Vehicle Tracking** (`/fleet/tracking`): map of each trip's route (depot → outlets → depot),
    live vehicle position, speed, fuel level, engine / cargo temperature, tyre pressure,
    vehicle condition, alerts, route stops and a movement log. Use the trip clock to play,
    speed up or scrub through the day.
- Routes created on the Dispatch page are saved as trips and open on Vehicle Tracking.

## New data files (public/)
vehicle_profiles.csv, vehicle_maintenance.csv, vehicle_fuel_log.csv,
vehicle_inspections.csv, vehicle_tracking.csv (today's trips), outlet_locations.csv.
vehicles.csv is unchanged.

## Notes
- Vehicle movement and sensor readings are simulated from the trip plan
  (src/data/tripSim.js). Replace `vehicleStateAt` with a real GPS/telematics feed later.
- Due/overdue checks use a fixed reference date of 27 Sep 2026 (REFERENCE_DATE in
  src/data/fleetStore.js) so the sample data stays meaningful.
- Vehicles, services and fuel fills added in the app are stored in the browser (localStorage).
- The map needs internet for map tiles and road-following routes; offline it shows straight lines.
