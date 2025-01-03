import { Router, type Request, type Response } from 'express';
const router = Router();

import HistoryService from '../../service/historyService.js';
import WeatherService from '../../service/weatherService.js';

//POST Request with city name to retrieve weather data
router.post('/', (req: Request, res: Response) => {
    //GET weather data from city name
  try {
    const cityName = req.body.cityName;
    WeatherService.getWeatherForCity(cityName).then(data => {
        //save city to search history
      HistoryService.addCity(cityName)
      res.json(data);
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching weather data');
  }
});

//GET search history
router.get('/history', async (_req: Request, res: Response) => {
HistoryService.getCities()
.then((data) => {
  return res.json(data)
})
.catch((err) => {
  res.status(500).json(err)
})
});

//DELETE city from search history
router.delete('/history/:id', async (req: Request, res: Response) => {
try {
  if(!req.params.id) {
    res.status(400).json({error: 'City ID is required'});
    return;
  }
  await HistoryService.removeCity(req.params.id);
  res.json({success: "Successfully removed city"});
} catch (err) {
  res.status(500).json({error: "Failed to remove city"});
}
});

export default router;
