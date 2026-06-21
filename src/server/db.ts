import fs from "fs";
import path from "path";
import crypto from "crypto";
import { 
  User, 
  EmissionFactor, 
  ActivityLog, 
  Streaks, 
  UserMilestone, 
  ActionSwap, 
  UserAction, 
  AIInsight,
  CategoryType,
  DashboardData
} from "../types.js";

// Static Action Library Database of 50 Swaps
export const STATIC_ACTIONS: ActionSwap[] = [
  // Transport (12)
  {
    key: "swap_car_metro",
    title: "Metro Passenger Commute",
    category: "transport",
    effort: "easy",
    weeklySavingKg: 18.0,
    annualSavingKg: 936,
    description: "Switch from single petrol driving to high-occupancy electric metropolitan rail transit.",
    impactText: "Saves high fuel-burn emissions per daily transit mile."
  },
  {
    key: "swap_car_cycle_short",
    title: "Cycle for Trips Under 5km",
    category: "transport",
    effort: "medium",
    weeklySavingKg: 12.0,
    annualSavingKg: 624,
    description: "Ride a bicycle instead of driving your car for quick neighborhood grocery lists and errands.",
    impactText: "Produces zero emissions while integrating carbon-free cardiovascular exercise."
  },
  {
    key: "swap_walk_local",
    title: "Walk for Local Shopping",
    category: "transport",
    effort: "easy",
    weeklySavingKg: 4.0,
    annualSavingKg: 208,
    description: "Take a walking trip for local items rather than starting up a cold combustion engine.",
    impactText: "100% emission-free and alleviates parking congestion."
  },
  {
    key: "swap_carpool_office",
    title: "Carpool to Work",
    category: "transport",
    effort: "medium",
    weeklySavingKg: 15.0,
    annualSavingKg: 780,
    description: "Share the passenger seats of your commuter vehicle with an office colleague.",
    impactText: "Cuts commuting footprint in half with simple shared occupancy."
  },
  {
    key: "swap_ev_rental",
    title: "Opt for Electric Vehicle Hire",
    category: "transport",
    effort: "medium",
    weeklySavingKg: 24.0,
    annualSavingKg: 1248,
    description: "Pick an electric vehicle over standard petrol when renting cars for regional weekend trips.",
    impactText: "Eliminates tailpipe greenhouse gases completely."
  },
  {
    key: "swap_train_over_short_flight",
    title: "Train Instead of Short Domestic Flight",
    category: "transport",
    effort: "high",
    weeklySavingKg: 180.0,
    annualSavingKg: 9360,
    description: "Book an express electric high-speed train rather than a short domestic hop flight.",
    impactText: "Bypasses intensive high-altitude takeoff combustion fuels."
  },
  {
    key: "swap_work_from_home_2d",
    title: "Work From Home 2 Days Weekly",
    category: "transport",
    effort: "medium",
    weeklySavingKg: 22.0,
    annualSavingKg: 1144,
    description: "Eliminate your physical transit requirements completely for two days out of the working week.",
    impactText: "Directly saves petroleum volume and traffic stress."
  },
  {
    key: "swap_scooter_small",
    title: "Use Small Scooter for Solo Trips",
    category: "transport",
    effort: "easy",
    weeklySavingKg: 9.0,
    annualSavingKg: 468,
    description: "Take a standard moped or small displacement motorcycle instead of driving a heavy car.",
    impactText: "Slashes required kinetic energy outputs."
  },
  {
    key: "swap_eco_driving",
    title: "Practice Eco-Driving",
    category: "transport",
    effort: "easy",
    weeklySavingKg: 5.0,
    annualSavingKg: 260,
    description: "Keep standard tyre pressures optimized, avoid rapid throttle bursts, and coast smoothly.",
    impactText: "Improves fuel thermal efficiency by up to 15%."
  },
  {
    key: "swap_bus_commute",
    title: "Take Public City Bus",
    category: "transport",
    effort: "easy",
    weeklySavingKg: 14.0,
    annualSavingKg: 728,
    description: "Incorporate municipal transit systems into your daily commuting patterns.",
    impactText: "Efficient space utilization of heavy diesel line buses."
  },
  {
    key: "swap_train_holiday",
    title: "Opt for Rail Vacations",
    category: "transport",
    effort: "high",
    weeklySavingKg: 120.0,
    annualSavingKg: 6240,
    description: "Plan domestic summer vacations around electric rail destinations near home.",
    impactText: "Over 90% cleaner than comparative low-cost air tickets."
  },
  {
    key: "swap_run_errands_batch",
    title: "Batch Weekly Errands",
    category: "transport",
    effort: "easy",
    weeklySavingKg: 6.0,
    annualSavingKg: 312,
    description: "Consolidate separate grocery and lifestyle runs into one smart geographic route.",
    impactText: "Cuts down unnecessary cold-start petrol trips."
  },

  // Food (13)
  {
    key: "swap_beef_to_chicken",
    title: "Swap Beef for Chicken",
    category: "food",
    effort: "easy",
    weeklySavingKg: 13.5,
    annualSavingKg: 702,
    description: "Substitute environmental red beef portions with leaner poultry/chicken dishes.",
    impactText: "Clears massive ruminant-origin methane emission patterns."
  },
  {
    key: "swap_meatless_monday",
    title: "Adopt Meatless Monday",
    category: "food",
    effort: "easy",
    weeklySavingKg: 5.5,
    annualSavingKg: 286,
    description: "Eat purely vegetarian cuisines for exactly one day of the week.",
    impactText: "Directly skips severe livestock breeding water and logistics impacts."
  },
  {
    key: "swap_vegan_weekend",
    title: "Vegan Weekends",
    category: "food",
    effort: "medium",
    weeklySavingKg: 15.0,
    annualSavingKg: 780,
    description: "Consume strictly plant-based grains, veggies, leguminous soups, and fruits on Saturdays and Sundays.",
    impactText: "Substantially lowers baseline dietary carbon conversion rates."
  },
  {
    key: "swap_dairy_to_oat_milk",
    title: "Swap Dairy for Oat Milk",
    category: "food",
    effort: "easy",
    weeklySavingKg: 2.2,
    annualSavingKg: 114,
    description: "Substitute dairy cow milks in daily coffees and teas with sustainable oat milk.",
    impactText: "Fosters dramatic reductions in livestock land clearing."
  },
  {
    key: "swap_local_seasonal_food",
    title: "Sourcing Local Seasonal Produce",
    category: "food",
    effort: "easy",
    weeklySavingKg: 3.0,
    annualSavingKg: 156,
    description: "Purchase vegetable crops grown in regional farms matching the current season's climate.",
    impactText: "Circumvents high-energy greenhouse cultivation and fresh air freight."
  },
  {
    key: "swap_cheese_to_hummus",
    title: "Cheese to Hummus Spread",
    category: "food",
    effort: "easy",
    weeklySavingKg: 4.0,
    annualSavingKg: 208,
    description: "Use organic chickpea hummus on sandwiches and wraps instead of processed industrial cheeses.",
    impactText: "Halves high carbon-weight inputs of secondary dairy refinement."
  },
  {
    key: "swap_plant_patties",
    title: "Switch to Plant-Based Burgers",
    category: "food",
    effort: "easy",
    weeklySavingKg: 6.8,
    annualSavingKg: 353,
    description: "Incorporate modern soy or pea protein patties rather than buying standard beef patties.",
    impactText: "Requires up to 90% less land overhead."
  },
  {
    key: "swap_reduce_food_waste_p",
    title: "Halve Household Food Waste",
    category: "food",
    effort: "medium",
    weeklySavingKg: 4.5,
    annualSavingKg: 234,
    description: "Adopt plan-ahead weekly grocery shopping, smart freezing, and leftovers utilization.",
    impactText: "Curtails anaerobic methane decomposition in typical damp municipal landfills."
  },
  {
    key: "swap_chicken_to_lentils",
    title: "Swap Chicken for Lentils Twice",
    category: "food",
    effort: "medium",
    weeklySavingKg: 1.5,
    annualSavingKg: 78,
    description: "Eat split-lentil dahl, beans, or custom chickpea stews instead of poultry on multiple nights.",
    impactText: "Reduces agricultural chain energy by returning directly to base plants."
  },
  {
    key: "swap_fish_over_pork",
    title: "Fish over Pork for Protein",
    category: "food",
    effort: "easy",
    weeklySavingKg: 1.0,
    annualSavingKg: 52,
    description: "Substitute intense commercial pig cuts with certified sustainably sourced white fish.",
    impactText: "Evades land use conversion inputs of heavy terrestrial ranches."
  },
  {
    key: "swap_no_air_freight_berries",
    title: "Skip Air-Freighted Fruits",
    category: "food",
    effort: "medium",
    weeklySavingKg: 8.0,
    annualSavingKg: 416,
    description: "Refuse high-refrigerated berries imported from another hemisphere during deep winter.",
    impactText: "Bypasses high-carbon air logistics per calorie unit."
  },
  {
    key: "swap_cook_from_scratch",
    title: "Cook Raw Ingredients",
    category: "food",
    effort: "easy",
    weeklySavingKg: 2.0,
    annualSavingKg: 104,
    description: "Avoid premium packaged ready-meals in plastic trays by buying bulk direct vegetables.",
    impactText: "Saves redundant factory freezing and shipping loops."
  },
  {
    key: "swap_black_coffee",
    title: "Enjoy Black Specialty Coffee",
    category: "food",
    effort: "easy",
    weeklySavingKg: 1.8,
    annualSavingKg: 93,
    description: "Drink filter coffee or espressos pure without milking elements.",
    impactText: "Decouples the coffee experience from cattle farm methane loops."
  },

  // Energy (11)
  {
    key: "swap_ac_temp_26",
    title: "Raise AC Setting to 26°C",
    category: "energy",
    effort: "easy",
    weeklySavingKg: 6.5,
    annualSavingKg: 338,
    description: "Calibrate standard home AC climate controls around 25°C to 26°C with standard ceiling fans.",
    impactText: "Saves up to 18% of electric grid load during peak cooling seasons."
  },
  {
    key: "swap_led_bulbs",
    title: "Upgrade to Modern LED Bulbs",
    category: "energy",
    effort: "easy",
    weeklySavingKg: 2.5,
    annualSavingKg: 130,
    description: "Substitute old school glowing halogen bulbs in high-use light arrays with high-efficiency LEDs.",
    impactText: "Bypasses approximately 85% of energy converted uselessly to heat."
  },
  {
    key: "swap_cold_wash",
    title: "Cold Water Laundry Cycles",
    category: "energy",
    effort: "easy",
    weeklySavingKg: 1.2,
    annualSavingKg: 62.4,
    description: "Set washing machines to cold or eco wash taps (20°C).",
    impactText: "Thermal water heating comprises 90% of laundry machine energy cycles."
  },
  {
    key: "swap_line_dry",
    title: "Adopt Natural Line Drying",
    category: "energy",
    effort: "medium",
    weeklySavingKg: 10.0,
    annualSavingKg: 520,
    description: "Hang wet apparel out on outdoor lines or indoor collapsible racks instead of spinning dry.",
    impactText: "Zero electricity usage, harnessing free solar/wind evaporation."
  },
  {
    key: "swap_green_energy_provider",
    title: "Switch to Green Tariff matching",
    category: "energy",
    effort: "high",
    weeklySavingKg: 35.0,
    annualSavingKg: 1820,
    description: "Advise your local utility provider to allocate your billings exclusively to local solar-wind sources.",
    impactText: "Substitutes legacy regional coal and gas fuel load generation."
  },
  {
    key: "swap_unplug_phantom",
    title: "Kill Standby Phantom Power",
    category: "energy",
    effort: "easy",
    weeklySavingKg: 1.5,
    annualSavingKg: 78,
    description: "Unplug computer docks, televisions, and kitchen appliances when traveling or asleep.",
    impactText: "Terminates unnecessary micro-load loops."
  },
  {
    key: "swap_smart_thermostat",
    title: "Schedule Smart Thermostats",
    category: "energy",
    effort: "medium",
    weeklySavingKg: 12.0,
    annualSavingKg: 624,
    description: "Configure programmable digital timers to lower interior climate control bounds when empty.",
    impactText: "Ensures no heating units remain fully loaded during your office hours."
  },
  {
    key: "swap_shorter_shower",
    title: "Halve Shower Times",
    category: "energy",
    effort: "easy",
    weeklySavingKg: 5.0,
    annualSavingKg: 260,
    description: "Constrain individual bathing sessions from average 12 minutes down to exactly 6 minutes.",
    impactText: "Directly saves vast boilers electricity."
  },
  {
    key: "swap_boil_needed_water",
    title: "Boil Only Necessary Water",
    category: "energy",
    effort: "easy",
    weeklySavingKg: 0.8,
    annualSavingKg: 41.6,
    description: "Refill only the required cup water volume when choosing to run standard kitchen kettles.",
    impactText: "Avoids dragging large elements load unnecessarily."
  },
  {
    key: "swap_insulate_doors",
    title: "Apply Weatherstripping",
    category: "energy",
    effort: "medium",
    weeklySavingKg: 8.0,
    annualSavingKg: 416,
    description: "Fit draft sweeps under front doors and foam tape seals in loose window tracks.",
    impactText: "Slashes thermal leakage rate by up to 20% total."
  },
  {
    key: "swap_solar_solar_charger",
    title: "Utilize Small Local Solar Panels",
    category: "energy",
    effort: "medium",
    weeklySavingKg: 0.3,
    annualSavingKg: 15.6,
    description: "Incorporate outdoor patio solar chargers for mobile accessories, phones, and power banks.",
    impactText: "Clean, self-retaining grid-free generator habits."
  },

  // Shopping (8)
  {
    key: "swap_secondhand_clothing",
    title: "Buy Vintage Secondary Garments",
    category: "shopping",
    effort: "easy",
    weeklySavingKg: 7.0,
    annualSavingKg: 364,
    description: "Source your next dress, sweater, or pant items from secondhand/vintage retailers.",
    impactText: "Bypasses resource intensive textile manufacturing and agricultural raw cycles."
  },
  {
    key: "swap_repair_electronics",
    title: "Extend Hardware Lifespans",
    category: "shopping",
    effort: "high",
    weeklySavingKg: 60.0,
    annualSavingKg: 3120,
    description: "Change depleted rechargeable batteries or worn screens on smart tech rather than buying replacements.",
    impactText: "Sidesteps severe heavy-industrial microprocessor quartz fabrications."
  },
  {
    key: "swap_borrow_tools",
    title: "Rent Task-Specific Hardware",
    category: "shopping",
    effort: "easy",
    weeklySavingKg: 8.0,
    annualSavingKg: 416,
    description: "Incorporate tool libraries to borrow drill drivers, ladders, or lawn trimmers.",
    impactText: "Curbs surplus manufacturing loads for rarely-used household hardware."
  },
  {
    key: "swap_capsule_wardrobe",
    title: "Adopt a Capsule Wardrobe",
    category: "shopping",
    effort: "high",
    weeklySavingKg: 18.0,
    annualSavingKg: 936,
    description: "Maintain a stable aesthetic based on high-integrity matching clothing components.",
    impactText: "Eliminates participation in high-volume synthetic fast-fashion cycles."
  },
  {
    key: "swap_zero_waste_packaging",
    title: "Shop Zero-Waste Bulk Outlets",
    category: "shopping",
    effort: "medium",
    weeklySavingKg: 2.5,
    annualSavingKg: 130,
    description: "Refill reusable containers with bulk grains, ingredients, soaps, and home commodities.",
    impactText: "Eradicates oil refined petrochemical plastic packaging."
  },
  {
    key: "swap_e_library_books",
    title: "E-Books & Public Libraries",
    category: "shopping",
    effort: "easy",
    weeklySavingKg: 1.0,
    annualSavingKg: 52,
    description: "Acquire secondary library books or read on zero-emission electronic paper screens.",
    impactText: "Alleviates vast commercial paper harvesting, logistics, and print chemicals."
  },
  {
    key: "swap_durable_shoes",
    title: "Buy Repairable Footwear",
    category: "shopping",
    effort: "medium",
    weeklySavingKg: 5.0,
    annualSavingKg: 260,
    description: "Opt for premium repairable welted footwear that features replaceable natural rubber soles.",
    impactText: "Bypasses throwaway plastic polymers which quickly end up in landfills."
  },
  {
    key: "swap_reusable_bags_always",
    title: "Always Carry Canvas Bags",
    category: "shopping",
    effort: "easy",
    weeklySavingKg: 0.4,
    annualSavingKg: 20.8,
    description: "Keep lightweight pocket canvas bags packed in your jacket or daily backpack.",
    impactText: "Stops the manufacture of short-lived checkout single-use carrier sheets."
  },

  // Flight (6)
  {
    key: "swap_train_domestic",
    title: "Book Rapid Railroads Locally",
    category: "flight",
    effort: "high",
    weeklySavingKg: 220.0,
    annualSavingKg: 11440,
    description: "Choose clean intercity express trains instead of buying short-haul flight connections.",
    impactText: "Shifts travel to electric transport, saving 95% of aviation burns."
  },
  {
    key: "swap_teleconference_meeting",
    title: "Video Conference Business Meetings",
    category: "flight",
    effort: "high",
    weeklySavingKg: 450.0,
    annualSavingKg: 23400,
    description: "Conduct routine global company check-ins over fully interactive web calling platforms.",
    impactText: "Stops large transoceanic flight requirements directly."
  },
  {
    key: "swap_staycation_local",
    title: "Explore Regional Staycations",
    category: "flight",
    effort: "high",
    weeklySavingKg: 800.0,
    annualSavingKg: 41600,
    description: "Enjoy state reserves, national parks, and rustic countryside cabins located within a 200km radius.",
    impactText: "Eradicates the massive carbon weight of international passenger flights."
  },
  {
    key: "swap_economy_seating",
    title: "Fly Economy Class Always",
    category: "flight",
    effort: "medium",
    weeklySavingKg: 120.0,
    annualSavingKg: 6240,
    description: "Choose economy booking options when flight travel has no alternative transit.",
    impactText: "Maximizes density sharing of high-fossil commercial air travel."
  },
  {
    key: "swap_direct_flight_only",
    title: "Book Nonstop Direct Flights",
    category: "flight",
    effort: "easy",
    weeklySavingKg: 50.0,
    annualSavingKg: 2600,
    description: "Refuse cheap indirect ticket listings containing complex overlapping multi-takeoff layovers.",
    impactText: "Bypasses fuel-intensive redundant takeoff lift cycles."
  },
  {
    key: "swap_combine_travel_trips",
    title: "Consolidate Multiple Excursions",
    category: "flight",
    effort: "medium",
    weeklySavingKg: 200.0,
    annualSavingKg: 10400,
    description: "Merge multiple quick flights throughout the year into one well-spaced vacation journey.",
    impactText: "Curtails high recurring takeoff fuel overheads."
  }
];

// Rich set of pre-seeding emission factors
const PRE_SEED_FACTORS: Omit<EmissionFactor, "id">[] = [
  // Transport (14)
  { category: "transport", activityKey: "car_petrol_km", label: "Petrol Car", unit: "km", factorKg: 0.170, source: "IPCC AR6", description: "Average standard size petrol combustion engine car." },
  { category: "transport", activityKey: "car_petrol_large_km", label: "Large SUV Petrol", unit: "km", factorKg: 0.250, source: "IEA", description: "Heavy luxury SUV or performance truck." },
  { category: "transport", activityKey: "car_diesel_km", label: "Diesel Car", unit: "km", factorKg: 0.165, source: "Our World in Data", description: "Standard diesel passenger car." },
  { category: "transport", activityKey: "car_hybrid_km", label: "Hybrid Car", unit: "km", factorKg: 0.110, source: "EPA", description: "Efficient mild/full hybrid powertrain." },
  { category: "transport", activityKey: "car_ev_std_km", label: "Electric Car (Standard Grid)", unit: "km", factorKg: 0.055, source: "IEA", description: "EV charged using national electrical energy grid inputs." },
  { category: "transport", activityKey: "car_ev_green_km", label: "Electric Car (Solar Charged)", unit: "km", factorKg: 0.015, source: "Our World in Data", description: "EV charged directly via home solar array or green power tariff." },
  { category: "transport", activityKey: "scooter_electric_km", label: "Electric Scooter/Moped", unit: "km", factorKg: 0.010, source: "IPCC", description: "Lightweight commuter two-wheeler." },
  { category: "transport", activityKey: "motorcycle_petrol_km", label: "Petrol Motorcycle", unit: "km", factorKg: 0.100, source: "EPA", description: "Gasoline combustion motorcycle passenger run." },
  { category: "transport", activityKey: "bus_city_km", label: "Public City Bus", unit: "km", factorKg: 0.040, source: "Our World in Data", description: "Averaged occupancy on diesel city buses." },
  { category: "transport", activityKey: "train_metro_km", label: "Urban Train or Subway", unit: "km", factorKg: 0.018, source: "IEA", description: "Electric high-density city metro train runs." },
  { category: "transport", activityKey: "train_hsr_km", label: "Intercity High-Speed Train", unit: "km", factorKg: 0.006, source: "UIC", description: "Clean express locomotive rails." },
  { category: "transport", activityKey: "walking_km", label: "Walking/Running", unit: "km", factorKg: 0.000, source: "IPCC", description: "Absolutely zero emissions." },
  { category: "transport", activityKey: "bicycle_human_km", label: "Bicycle Ride", unit: "km", factorKg: 0.005, source: "Our World in Data", description: "Biological food energy conversion index." },
  { category: "transport", activityKey: "rideshare_petrol_km", label: "Petrol Rideshare Ride", unit: "km", factorKg: 0.200, source: "EPA", description: "On-demand hailing, including empty cruise loops." },

  // Food (16)
  { category: "food", activityKey: "food_beef_steak", label: "Beef steak/portion (200g)", unit: "portion", factorKg: 11.800, source: "IPCC AR6", description: "Beef cattle produce heavy methane during digestive rumination." },
  { category: "food", activityKey: "food_beef_burger", label: "Beef burger (portion)", unit: "portion", factorKg: 7.500, source: "Our World in Data", description: "Beef processed patty burger impact." },
  { category: "food", activityKey: "food_pork", label: "Pork cut (150g)", unit: "portion", factorKg: 1.100, source: "Our World in Data", description: "Average grain-fed intensive pig meat." },
  { category: "food", activityKey: "food_chicken", label: "Poultry/Chicken (200g)", unit: "portion", factorKg: 0.750, source: "Our World in Data", description: "Chicken broiler breed energy and logistics index." },
  { category: "food", activityKey: "food_egg", label: "Egg", unit: "egg", factorKg: 0.150, source: "IPCC", description: "Free-range or battery layer output." },
  { category: "food", activityKey: "food_fish_farmed", label: "Farmed Salmon", unit: "portion", factorKg: 1.200, source: "Our World in Data", description: "Feed mills and oxygen pumping energy weight." },
  { category: "food", activityKey: "food_fish_wild", label: "Wild White Fish", unit: "portion", factorKg: 0.450, source: "Our World in Data", description: "Fisheries diesel fuel usage index." },
  { category: "food", activityKey: "food_cheese_100g", label: "Cheese slice/portion (100g)", unit: "portion", factorKg: 2.300, source: "IPCC AR6", description: "High volume milk intake required per kg." },
  { category: "food", activityKey: "food_dairy_milk_glass", label: "Dairy Milk (250ml)", unit: "glass", factorKg: 0.420, source: "Our World in Data", description: "Dairy bovine husbandry outputs." },
  { category: "food", activityKey: "food_plant_milk_glass", label: "Oat or Almond Milk (250ml)", unit: "glass", factorKg: 0.090, source: "Our World in Data", description: "Very light footprint alternative dairy crop extraction." },
  { category: "food", activityKey: "food_vegetarian_meal", label: "Vegetarian Meal", unit: "meal", factorKg: 0.450, source: "Our World in Data", description: "Balanced plant selection including some cheese/egg elements." },
  { category: "food", activityKey: "food_vegan_meal", label: "Vegan Meal", unit: "meal", factorKg: 0.250, source: "Our World in Data", description: "Pure plant components; lowest general impact." },
  { category: "food", activityKey: "food_rice_bowl", label: "Rice Bowl (150g)", unit: "bowl", factorKg: 0.350, source: "Our World in Data", description: "Anaerobic methane emissions in flooded agricultural paddy soils." },
  { category: "food", activityKey: "food_wheat_serving", label: "Pasta or Bread serving (100g)", unit: "serving", factorKg: 0.080, source: "Our World in Data", description: "Grains harvested directly with minimal logistical processing." },
  { category: "food", activityKey: "food_avocado_kg", label: "Imported Avocado", unit: "kg", factorKg: 1.800, source: "Our World in Data", description: "Vast irrigation crops and refrigerated overseas container slots." },
  { category: "food", activityKey: "food_local_veg_kg", label: "Local Seasonal Veggies", unit: "kg", factorKg: 0.200, source: "IPCC", description: "Harvested locally in open soils without heated glasshouses." },

  // Energy (9)
  { category: "energy", activityKey: "energy_elec_coal_kwh", label: "Fossil Fuel Electricity", unit: "kWh", factorKg: 0.650, source: "IEA", description: "Grid energy primarily fueled by coal or natural gas combustion." },
  { category: "energy", activityKey: "energy_elec_mixed_kwh", label: "Standard Grid Electricity", unit: "kWh", factorKg: 0.450, source: "IEA", description: "National averaged power systems blend." },
  { category: "energy", activityKey: "energy_elec_solar_kwh", label: "Solar or Wind Energy", unit: "kWh", factorKg: 0.020, source: "Our World in Data", description: "Lifecycle solar photovoltaic manufacture costs." },
  { category: "energy", activityKey: "energy_gas_heating_kwh", label: "Natural Gas Burned", unit: "kWh", factorKg: 0.185, source: "EPA", description: "Direct domestic heating or range stove gas burn." },
  { category: "energy", activityKey: "energy_ac_hour", label: "Air Conditioning", unit: "hour", factorKg: 0.675, source: "EPA", description: "Cooling loads hourly using 1.5kW average split climate gear." },
  { category: "energy", activityKey: "energy_hot_shower_10m", label: "Hot Shower (10 mins)", unit: "shower", factorKg: 0.900, source: "Waterwise", description: "Thermal heaters energy required to hot-flush 80L reservoir." },
  { category: "energy", activityKey: "energy_dryer_cycle", label: "Clothes Dryer Run", unit: "cycle", factorKg: 1.800, source: "EPA", description: "High heat intensive electric dryer operation." },
  { category: "energy", activityKey: "energy_washer_eco_cycle", label: "Eco Washing Machine Run", unit: "cycle", factorKg: 0.150, source: "EPA", description: "Energy efficiency optimized cold tap wash." },
  { category: "energy", activityKey: "energy_space_heater_h", label: "Electric Space Heater", unit: "hour", factorKg: 0.900, source: "EPA", description: "Direct resistive heater coil loading 2kW." },

  // Shopping (8)
  { category: "shopping", activityKey: "shop_tshirt_fast", label: "Fast Fashion Shirt", unit: "item", factorKg: 7.500, source: "Our World in Data", description: "Polyester synthetic blend cheap rapid apparel." },
  { category: "shopping", activityKey: "shop_jeans_organic", label: "Organic Cotton Jeans", unit: "item", factorKg: 12.000, source: "Our World in Data", description: "Heavy denim water purification and pesticide-free fabrics." },
  { category: "shopping", activityKey: "shop_leather_shoes", label: "Leather Shoes/Boots", unit: "pair", factorKg: 35.000, source: "IPCC", description: "High carbon and chemical tannery impacts of raw cowhide leather." },
  { category: "shopping", activityKey: "shop_running_shoes", label: "Running Shoes", unit: "pair", factorKg: 14.000, source: "MIT Study", description: "Complex laminated oil-derived EVA foam polymers." },
  { category: "shopping", activityKey: "shop_smartphone", label: "New Tech Smartphone", unit: "item", factorKg: 75.000, source: "Apple ESG Report", description: "Intense manufacturing microelectronics cleanrooms and supply paths." },
  { category: "shopping", activityKey: "shop_laptop", label: "New Tech Laptop", unit: "item", factorKg: 280.000, source: "Dell ESG Report", description: "Heavy refining inputs of aluminum housings, displays, and processors." },
  { category: "shopping", activityKey: "shop_book", label: "Physical Book", unit: "item", factorKg: 1.200, source: "Our World in Data", description: "Timber harvesting plus log printing refinery." },
  { category: "shopping", activityKey: "shop_snack_bottle", label: "PET Bottled Drink/Snack", unit: "item", factorKg: 0.300, source: "Our World in Data", description: "Single-use plastic polymer raw extrusion and shipping." },

  // Flight (4)
  { category: "flight", activityKey: "flight_domestic_rt", label: "Short Domestic Flight (RT)", unit: "trip", factorKg: 250.000, source: "ICAO", description: "High take-off kerosene fuel-burnt segments (< 3 hour trip)." },
  { category: "flight", activityKey: "flight_med_hour", label: "Medium-Haul Flight", unit: "hour", factorKg: 140.000, source: "IPCC AR6", description: "High-altitude turbine index per passenger hour (3-6 hr range)." },
  { category: "flight", activityKey: "flight_long_hour", label: "Long-Haul Flight", unit: "hour", factorKg: 110.000, source: "IPCC AR6", description: "Efficient long cruiser speed altitude segments (> 6 hr range)." },
  { category: "flight", activityKey: "flight_business_hour", label: "Business Class Space Premium", unit: "hour", factorKg: 290.000, source: "WWF", description: "Proportionally higher seat physical footprint impact index on jets." }
];

// Database Schema interface
interface DatabaseSchema {
  users: User[];
  activityLogs: ActivityLog[];
  streaks: Streaks[];
  userMilestones: UserMilestone[];
  userActions: UserAction[];
  aiInsights: AIInsight[];
  emissionFactors: EmissionFactor[];
  sessions: { userId: string; token: string; expiresAt: string }[];
}

const DB_FILE = path.resolve(process.cwd(), "db.json");

class Database {
  private data: DatabaseSchema = {
    users: [],
    activityLogs: [],
    streaks: [],
    userMilestones: [],
    userActions: [],
    aiInsights: [],
    emissionFactors: [],
    sessions: []
  };

  constructor() {
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, "utf-8");
        this.data = JSON.parse(raw);
        // Ensure standard fields exist
        if (!this.data.users) this.data.users = [];
        if (!this.data.activityLogs) this.data.activityLogs = [];
        if (!this.data.streaks) this.data.streaks = [];
        if (!this.data.userMilestones) this.data.userMilestones = [];
        if (!this.data.userActions) this.data.userActions = [];
        if (!this.data.aiInsights) this.data.aiInsights = [];
        if (!this.data.emissionFactors) this.data.emissionFactors = [];
        if (!this.data.sessions) this.data.sessions = [];
      } else {
        this.seed();
      }
    } catch (e) {
      console.error("Failed to parse db.json, seeding new database file:", e);
      this.seed();
    }
  }

  private save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), "utf-8");
    } catch (e) {
      console.error("Failed to serialize and write database state:", e);
    }
  }

  private seed() {
    // Populate emission factors
    const seededFactors: EmissionFactor[] = PRE_SEED_FACTORS.map((f, index) => ({
      ...f,
      id: index + 1
    }));

    this.data = {
      users: [],
      activityLogs: [],
      streaks: [],
      userMilestones: [],
      userActions: [],
      aiInsights: [],
      emissionFactors: seededFactors,
      sessions: []
    };
    this.save();
    console.log(`Database seeded successfully with ${seededFactors.length} emission factors.`);
  }

  // --- EMISSION FACTORS ---
  public getEmissionFactors(): EmissionFactor[] {
    return this.data.emissionFactors;
  }

  public getEmissionFactorById(id: number): EmissionFactor | undefined {
    return this.data.emissionFactors.find(f => f.id === id);
  }

  // --- USERS & AUTH ---
  public getUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  public getUserByEmail(email: string): User | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public createUser(
    email: string, 
    passwordHash: string, 
    countryCode: string, 
    householdSize: number, 
    commuteType: string, 
    dailyBudgetKg: number = 5.50
  ): User {
    const user: User = {
      id: crypto.randomUUID(),
      email: email,
      passwordHash: passwordHash,
      countryCode: countryCode,
      householdSize: householdSize,
      commuteType: commuteType,
      dailyBudgetKg: dailyBudgetKg,
      createdAt: new Date().toISOString()
    };
    this.data.users.push(user);

    // Bootstrap streaks entry
    const userStreaks: Streaks = {
      userId: user.id,
      currentStreak: 0,
      longestStreak: 0,
      lastUnderBudgetDatetime: null
    };
    this.data.streaks.push(userStreaks);

    this.save();
    return user;
  }

  public updateUserProfile(
    userId: string, 
    data: Partial<Pick<User, "countryCode" | "householdSize" | "commuteType" | "dailyBudgetKg" | "email">>
  ): User {
    const idx = this.data.users.findIndex(u => u.id === userId);
    if (idx === -1) throw new Error("User profile not found.");

    this.data.users[idx] = {
      ...this.data.users[idx],
      ...data
    };
    this.save();
    return this.data.users[idx];
  }

  public deleteUser(userId: string) {
    this.data.users = this.data.users.filter(u => u.id !== userId);
    this.data.activityLogs = this.data.activityLogs.filter(l => l.userId !== userId);
    this.data.streaks = this.data.streaks.filter(s => s.userId !== userId);
    this.data.userMilestones = this.data.userMilestones.filter(m => m.userId !== userId);
    this.data.userActions = this.data.userActions.filter(a => a.userId !== userId);
    this.data.aiInsights = this.data.aiInsights.filter(i => i.userId !== userId);
    this.data.sessions = this.data.sessions.filter(s => s.userId !== userId);
    this.save();
  }

  // --- SESSIONS ---
  public createSession(userId: string): string {
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days
    this.data.sessions.push({ userId, token, expiresAt });
    this.save();
    return token;
  }

  public getSession(token: string): string | null {
    const found = this.data.sessions.find(s => s.token === token);
    if (!found) return null;

    if (new Date(found.expiresAt).getTime() < Date.now()) {
      // Clean upexpired session
      this.data.sessions = this.data.sessions.filter(s => s.token !== token);
      this.save();
      return null;
    }
    return found.userId;
  }

  public destroySession(token: string) {
    this.data.sessions = this.data.sessions.filter(s => s.token !== token);
    this.save();
  }

  // --- LOGS ---
  public getLogs(userId: string): ActivityLog[] {
    return this.data.activityLogs
      .filter(l => l.userId === userId)
      .map(log => {
        const factor = this.getEmissionFactorById(log.factorId);
        return {
          ...log,
          activityLabel: factor ? factor.label : "Unknown Activity",
          activityCategory: factor ? factor.category : "transport"
        };
      })
      .sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime());
  }

  public addLog(userId: string, factorId: number, quantity: number, note: string, loggedAtOption?: string): ActivityLog {
    const factor = this.getEmissionFactorById(factorId);
    if (!factor) throw new Error("Invalid emission factor type.");

    // Formula: quantity * factorKg * household regional/household modifier
    // Let's implement per-capita sharing for household items if categorized as 'energy':
    const user = this.getUserById(userId);
    const householdDivisor = (factor.category === "energy" && user) ? user.householdSize : 1;
    const computedEmission = (quantity * factor.factorKg) / householdDivisor;

    const log: ActivityLog = {
      id: crypto.randomUUID(),
      userId: userId,
      factorId: factorId,
      quantity: quantity,
      emissionKg: Number(computedEmission.toFixed(3)),
      loggedAt: loggedAtOption || new Date().toISOString(),
      note: note
    };

    this.data.activityLogs.push(log);
    this.save();

    // Trigger Side Effects
    this.recalculateStreaks(userId);
    this.evaluateMilestones(userId);

    // Return decorated
    return {
      ...log,
      activityLabel: factor.label,
      activityCategory: factor.category
    };
  }

  public deleteLog(userId: string, logId: string) {
    const log = this.data.activityLogs.find(l => l.id === logId && l.userId === userId);
    if (!log) throw new Error("Log record not found.");

    this.data.activityLogs = this.data.activityLogs.filter(l => l.id !== logId);
    this.save();

    // Re-evaluate
    this.recalculateStreaks(userId);
    this.evaluateMilestones(userId);
  }

  // --- STREAK & BUDGET RECALCULATION ENGINE ---
  public getStreaks(userId: string): Streaks {
    let stre = this.data.streaks.find(s => s.userId === userId);
    if (!stre) {
      stre = {
        userId,
        currentStreak: 0,
        longestStreak: 0,
        lastUnderBudgetDatetime: null
      };
      this.data.streaks.push(stre);
      this.save();
    }
    return stre;
  }

  public recalculateStreaks(userId: string) {
    const user = this.getUserById(userId);
    if (!user) return;

    const limit = user.dailyBudgetKg;
    const logs = this.data.activityLogs.filter(l => l.userId === userId);
    if (logs.length === 0) return;

    // Group emission by calendar local date (YYYY-MM-DD)
    const dailyExpenses: Record<string, number> = {};
    logs.forEach(l => {
      const dateStr = l.loggedAt.substring(0, 10); // YYYY-MM-DD
      dailyExpenses[dateStr] = (dailyExpenses[dateStr] || 0) + l.emissionKg;
    });

    // Sort dates
    const dates = Object.keys(dailyExpenses).sort();
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let lastDateUnderStr: string | null = null;

    // We can evaluate streaks chronologically
    dates.forEach(dateStr => {
      const isUnder = dailyExpenses[dateStr] <= limit;
      if (isUnder) {
        tempStreak++;
        lastDateUnderStr = dateStr;
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
        }
      } else {
        tempStreak = 0;
      }
    });

    // Check if the current streak is broken (has user logged anything under budget today/yesterday?)
    const todayStr = new Date().toISOString().substring(0, 10);
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toISOString().substring(0, 10);

    // Is the user currently under budget today or yesterday?
    const todayUnder = (dailyExpenses[todayStr] ?? 0) <= limit && (dailyExpenses[todayStr] !== undefined);
    const yesterdayUnder = (dailyExpenses[yesterdayStr] ?? 0) <= limit && (dailyExpenses[yesterdayStr] !== undefined);

    if (todayUnder || yesterdayUnder) {
      // Count backwards from today/yesterday to set exact current streak
      let checkDate = new Date();
      currentStreak = 0;
      while (true) {
        const checkStr = checkDate.toISOString().substring(0, 10);
        const hasLogsOnDay = dailyExpenses[checkStr] !== undefined;
        const totalOnDay = dailyExpenses[checkStr] ?? 0;
        if (hasLogsOnDay && totalOnDay <= limit) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          // If we reach a day with no logs at all, check if that breaks active count.
          // Wait, if they just haven't logged anything today yet, but were under budget yesterday,
          // the streak holds.
          const isTodayCheck = checkStr === todayStr;
          if (isTodayCheck) {
            // Bypass today, check yesterday
            checkDate.setDate(checkDate.getDate() - 1);
            continue;
          }
          break;
        }
      }
    } else {
      currentStreak = 0;
    }

    // Save
    const idx = this.data.streaks.findIndex(s => s.userId === userId);
    if (idx !== -1) {
      this.data.streaks[idx] = {
        userId,
        currentStreak,
        longestStreak: Math.max(longestStreak, this.data.streaks[idx].longestStreak),
        lastUnderBudgetDatetime: lastDateUnderStr ? new Date(lastDateUnderStr).toISOString() : null
      };
    } else {
      this.data.streaks.push({
        userId,
        currentStreak,
        longestStreak,
        lastUnderBudgetDatetime: lastDateUnderStr ? new Date(lastDateUnderStr).toISOString() : null
      });
    }
    this.save();
  }

  // --- ACTION LIBRARY PORTING ---
  public getUserActions(userId: string): UserAction[] {
    return this.data.userActions.filter(a => a.userId === userId);
  }

  public toggleAction(userId: string, actionKey: string, status: "bookmarked" | "adopted" | "removed"): UserAction | null {
    const idx = this.data.userActions.findIndex(a => a.userId === userId && a.actionKey === actionKey);

    if (status === "removed") {
      if (idx !== -1) {
        this.data.userActions.splice(idx, 1);
        this.save();
      }
      return null;
    }

    if (idx !== -1) {
      this.data.userActions[idx].status = status;
      if (status === "adopted") {
        this.data.userActions[idx].adoptedAt = new Date().toISOString();
      }
      this.save();
      return this.data.userActions[idx];
    } else {
      const uAction: UserAction = {
        id: crypto.randomUUID(),
        userId: userId,
        actionKey: actionKey,
        status: status,
        ...(status === "adopted" ? { adoptedAt: new Date().toISOString() } : {})
      };
      this.data.userActions.push(uAction);
      this.save();
      this.evaluateMilestones(userId);
      return uAction;
    }
  }

  // --- MILESTONES EVALUATION BED ---
  public getMilestones(userId: string): UserMilestone[] {
    return this.data.userMilestones.filter(m => m.userId === userId);
  }

  public evaluateMilestones(userId: string) {
    const logs = this.data.activityLogs.filter(l => l.userId === userId);
    const uActions = this.data.userActions.filter(a => a.userId === userId);
    const mStreaks = this.getStreaks(userId);

    const earnedKeys = new Set(this.data.userMilestones.filter(m => m.userId === userId).map(m => m.milestoneKey));

    const checkAndAward = (key: string, name: string, desc: string, icon: string, condition: boolean) => {
      if (condition && !earnedKeys.has(key)) {
        this.data.userMilestones.push({
          id: crypto.randomUUID(),
          userId,
          milestoneKey: key,
          badgeName: name,
          description: desc,
          iconName: icon,
          earnedAt: new Date().toISOString()
        });
        console.log(`Milestone awarded: ${name} to user ${userId}`);
      }
    };

    // 1. First Log
    checkAndAward(
      "first_log", 
      "Carbon Pioneer", 
      "Logged your very first carbon-impacting activity.", 
      "compass", 
      logs.length >= 1
    );

    // 2. 7-Day Streak
    checkAndAward(
      "streak_7", 
      "Efficiency Master", 
      "Maintained a carbon baseline under budget for 7 consecutive days.", 
      "flame", 
      mStreaks.longestStreak >= 7
    );

    // 3. Green Commuter (logged walking, train, metro, or cycling transport logs >= 5 times)
    const greenTransitLogsCount = logs.filter(l => {
      const factor = this.getEmissionFactorById(l.factorId);
      if (!factor || factor.category !== "transport") return false;
      return ["walking_km", "bicycle_human_km", "train_metro_km", "train_hsr_km", "car_ev_green_km"].includes(factor.activityKey);
    }).length;
    checkAndAward(
      "green_commuter", 
      "Transit Purist", 
      "Logged 5 eco-friendly transport segments (walking, train, cycling, shared metro).", 
      "bike", 
      greenTransitLogsCount >= 5
    );

    // 4. Vegan Champ (vegan/vegetarian meals at least 5 times)
    const veganMealsLogsCount = logs.filter(l => {
      const factor = this.getEmissionFactorById(l.factorId);
      if (!factor || factor.category !== "food") return false;
      return ["food_vegetarian_meal", "food_vegan_meal", "food_plant_milk_glass"].includes(factor.activityKey);
    }).length;
    checkAndAward(
      "vegan_champ", 
      "Planet over Plate", 
      "Logged plant-based dietary entries 5 or more times.", 
      "leaf", 
      veganMealsLogsCount >= 5
    );

    // 5. Adopted 5 Actions
    const adoptedActionsCount = uActions.filter(a => a.status === "adopted").length;
    checkAndAward(
      "adopted_5", 
      "Habit Transformer", 
      "Adopted 5 or more carbon-reducing sustainable swaps from the catalog.", 
      "sparkles", 
      adoptedActionsCount >= 5
    );

    // 6. Energy Saver (logged solar energy, cooling setting limits, or eco wash >= 5 times)
    const ecoEnergyCount = logs.filter(l => {
      const factor = this.getEmissionFactorById(l.factorId);
      if (!factor || factor.category !== "energy") return false;
      return ["energy_elec_solar_kwh", "energy_washer_eco_cycle"].includes(factor.activityKey);
    }).length;
    checkAndAward(
      "energy_saver", 
      "Volt Guardian", 
      "Logged renewable power or custom appliances eco-operation 5 times.", 
      "zap", 
      ecoEnergyCount >= 5
    );

    // 7. Cut CO2 20% compared to typical baseline of regional average count (baseline budget ~38.5kg/week, user logged under 30.8kg in last 7 days)
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const lastWeekLogs = logs.filter(l => new Date(l.loggedAt).getTime() >= oneWeekAgo);
    const lastWeekTotal = lastWeekLogs.reduce((acc, l) => acc + l.emissionKg, 0);
    checkAndAward(
      "cut_co2_20", 
      "Carbon Shrinker", 
      "Logged under 26 kgCO₂e of weekly emissions (saving 30%+ compared to national averages).", 
      "trending-down", 
      logs.length >= 5 && lastWeekTotal > 0 && lastWeekTotal <= 26.0
    );

    this.save();
  }

  // --- AI INSIGHT CACHING ENGINE ---
  public getCachedInsight(userId: string, weekStart: string): AIInsight | null {
    const found = this.data.aiInsights.find(i => i.userId === userId && i.weekStart === weekStart);
    return found || null;
  }

  public saveInsight(userId: string, weekStart: string, insight: Omit<AIInsight, "userId" | "weekStart" | "generatedAt">): AIInsight {
    // Remove if existing
    this.data.aiInsights = this.data.aiInsights.filter(i => !(i.userId === userId && i.weekStart === weekStart));

    const completeInsight: AIInsight = {
      ...insight,
      userId,
      weekStart,
      generatedAt: new Date().toISOString()
    };
    this.data.aiInsights.push(completeInsight);
    this.save();
    return completeInsight;
  }
}

export const db = new Database();
export default db;
