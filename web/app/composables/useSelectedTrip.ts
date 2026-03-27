type SelectedTrip = {
  id: string;
  name: string;
};

const SELECTED_TRIP_STORAGE_KEY = "expense-web-selected-trip";

export function useSelectedTrip() {
  const selectedTrip = useState<SelectedTrip | null>("selected_trip", () => null);
  const initialized = useState<boolean>("selected_trip_initialized", () => false);

  function init() {
    if (!process.client || initialized.value) {
      return;
    }

    const saved = localStorage.getItem(SELECTED_TRIP_STORAGE_KEY);
    if (saved) {
      try {
        selectedTrip.value = JSON.parse(saved) as SelectedTrip;
      } catch {
        localStorage.removeItem(SELECTED_TRIP_STORAGE_KEY);
      }
    }

    initialized.value = true;
  }

  function setSelectedTrip(trip: SelectedTrip | null) {
    selectedTrip.value = trip;

    if (!process.client) {
      return;
    }

    if (trip) {
      localStorage.setItem(SELECTED_TRIP_STORAGE_KEY, JSON.stringify(trip));
    } else {
      localStorage.removeItem(SELECTED_TRIP_STORAGE_KEY);
    }
  }

  return {
    selectedTrip,
    init,
    setSelectedTrip,
  };
}
