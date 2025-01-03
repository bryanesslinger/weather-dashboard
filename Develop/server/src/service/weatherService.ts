import Dayjs from 'dayjs';
import dotenv from "dotenv";
dotenv.config();

//Define an interface for the Coordinates object

interface Coordinates {
  lat: number;
  lon: number;
}

//Define a class for the Weather object

class Weather {
  city: string;
  tempF: number;
  windSpeed: number;
  humidity: number;
  date: string;
  icon: string;
  description: string;

  constructor(
    city: string,
    tempF: number,
    windSpeed: number,
    humidity: number,
    date: string,
    icon: string,
    description: string
  ) {
    this.city = city;
    this.tempF = tempF;
    this.windSpeed = windSpeed;
    this.humidity = humidity;
    this.date = date;
    this.icon = icon;
    this.description = description;
  }
}

// Complete the WeatherService class
class WeatherService {
  //Define the baseURL, API key, and city name properties
  private baseURL: string;
  private apiKey: string;
  private cityName: string;

  constructor() {
    this.baseURL = process.env.API_BASE_URL || "";
    this.apiKey = process.env.API_KEY || "";
    this.cityName = "";
  }

  //Create fetchLocationData method
  // private async fetchLocationData(query: string) {
  //   //fetch location
  //   try {
  //     //if we can't get URL or API key we shouldn't try to run it
  //     if (!this.baseURL || !this.apiKey) {
  //       throw new Error("Key or URL not found. Please try again");
  //     }
  //     const response: Coordinates = await fetch(query).then((res) =>
  //       res.json()
  //     );
  //     return response;
  //   } catch (error) {
  //     console.error(error);
  //     throw error;
  //   }
  // }
  private async fetchLocationData(query: string): Promise<Coordinates> {
    try {
      // If URL or API key are missing, throw an error
      if (!this.baseURL || !this.apiKey) {
        throw new Error("Key or URL not found. Please try again");
      }
  
      const response = await fetch(query);
      const data = await response.json();
  
      // Check if data contains lat and lon
      if (!data || !data[0] || !data[0].lat || !data[0].lon) {
        throw new Error("Invalid location data received");
      }
  
      return {
        lat: data[0].lat,
        lon: data[0].lon
      };
  
    } catch (error) {
      console.error("Error fetching location data:", error);
      throw error;
    }
  }


  //Create destructureLocationData method
  private destructureLocationData(locationData: Coordinates): Coordinates {
    //returns lat and lon
    if (!locationData) {
      throw new Error("Please provide a location");
    }
    const { lat, lon } = locationData;
    const coordinates: Coordinates = {
      lat,
      lon,
    };

    return coordinates;
  }
  //Create buildGeocodeQuery method
  private buildGeocodeQuery(): string {
    const geoQuery = `${this.baseURL}/geo/1.0/direct?q=${this.cityName}&appid=${this.apiKey}`;
    return geoQuery;
  }
  //Create buildWeatherQuery method
  private buildWeatherQuery(coordinates: Coordinates): string {
    const weatherQuery = `https://api.openweathermap.org/data/2.5/forecast?lat=${coordinates.lat}&lon=${coordinates.lon}&appid=${this.apiKey}`;
    //&units=imperial
    return weatherQuery;
  }

  //Create fetchAndDestructureLocationData method
  private async fetchAndDestructureLocationData() {
    return await this.fetchLocationData(this.buildGeocodeQuery()).then((data) =>
      this.destructureLocationData(data)
    );
  }
  // Create fetchWeatherData method
  private async fetchWeatherData(coordinates: Coordinates) {
    try {
      const response = await fetch(this.buildWeatherQuery(coordinates)).then(
        (res) => res.json()
      );
      if (!response) {
        throw new Error('Weather data not found');
      }
      const currentWeather: Weather = this.parseCurrentWeather(response.list[0]);
      const forecast: Weather[] = this.buildForecastArray(
        currentWeather,
        response.list
      );
      return forecast;
    } catch (error: any) {
      console.error(error);
      return error;
    }
    
  }
  // Build parseCurrentWeather method
  private parseCurrentWeather(response: any) {
    const parsedDate = Dayjs.unix(response.dt).format('M/D/YYYY');
    // const tempF = (response.main.temp - 273.15) * 9/5 + 32;
    // Convert temperature from Kelvin to Fahrenheit
  let tempF = (response.main.temp - 273.15) * 9/5 + 32;
  // Format the temperature to two decimal points
  tempF = parseFloat(tempF.toFixed(2));
    const currentWeather = new Weather(
      this.cityName,
      tempF,
      response.wind.speed,
      response.main.humidity,
      parsedDate,
      response.weather[0].icon,
      response.weather[0].description || response.weather[0].main

    );
    return currentWeather;
  }
  //Complete buildForecastArray method
private buildForecastArray(currentWeather: Weather, weatherData: any[]) {
const weatherForecast: Weather[] = [currentWeather];
const filteredWeatherData = weatherData.filter((data: any) => {
  return data.dt_txt.includes('12:00:00');
});
console.log(filteredWeatherData);
for (const day of filteredWeatherData) {
  let tempF = (day.main.temp - 273.15) * 9/5 + 32;
  // Format the temperature to two decimal points
  tempF = parseFloat(tempF.toFixed(2));
  weatherForecast.push(
    new Weather(
      this.cityName,
      tempF,
      day.wind.speed,
      day.main.humidity,
      Dayjs.unix(day.dt).format('M/D/YYYY'),
      day.weather[0].icon,
      day.weather[0].description || day.weather[0].main
    )
  );
}

return weatherForecast;

  }
  //Complete getWeatherForCity method
  async getWeatherForCity(city: string) {
try {
  this.cityName = city;
  if (!this.cityName) {
    throw new Error("City name is required");
  }
  const coordinates = await this.fetchAndDestructureLocationData();
  if (coordinates) {
    const weather = await this.fetchWeatherData(coordinates);
    return weather;
  }
  throw new Error('Weather data not found');
} catch (error) {
  console.error(error);
  throw error;
}
  }
}

export default new WeatherService();
