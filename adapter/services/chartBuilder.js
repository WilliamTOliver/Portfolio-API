exports.buildCharts = cb => {
  const mongoose = require('mongoose');
  const fs = require('file-system');
  const PythonShell = require('python-shell');
  const Chart = require('../models/chart');
  Chart.remove({}, err => {
    console.log('Cleared Chart Collection');
    const createChart = chart => {
      const newChart = new Chart({
        _id: new mongoose.Types.ObjectId(),
        chart
      });
      newChart.save();
    };
    const buildChartObject = (chartData, chartType) => {
      const chart = {};
      chart.xAxis = { type: 'value' };
      chart.yAxis = { type: 'value' };
      switch (chartData.type) {
        case 'simple-linear':
          chart.series = [
            {
              color: 'red',
              type: 'scatter',
              data: chartData.yTrain.map((yCoord, index) => {
                return [chartData.xTrain[index][0], yCoord];
              })
            },
            {
              color: 'blue',
              type: 'scatter',
              data: chartData.yTest.map((yCoord, index) => {
                return [chartData.xTest[index][0], yCoord];
              })
            },
            {
              color: 'gold',
              type: 'line',
              data: chartData.yPred.map((yCoord, index) => {
                return [chartData.xTest[index][0], yCoord];
              })
            }
          ];
          break;
        default:
          chart.series = [
            {
              color: 'red',
              type: 'scatter',
              data: chartData.y.map((yCoord, index) => {
                return [chartData.X[index][0], yCoord];
              })
            },
            {
              color: 'blue',
              type: 'line',
              data: chartData.Y_grid.map((yCoord, index) => {
                return [chartData.X_grid[index][0], yCoord];
              })
            }
          ];
          break;
      }
      return chart;
    };

    fs.readdir('./services', function(err, items) {
      let result = [];
      for (let i = 0; i < items.length; i++) {
        console.log(items.length);
        console.log(result);
        let item = items[i];
        fs.readdir(`./services/${item}`, function(err, items) {
          let pythonFile = items.filter(
            item => item.slice(item.length - 2, item.length) === 'py'
          )[0];
          PythonShell.run(`./services/${item}/${pythonFile}`, {}, function(
            err,
            data
          ) {
            if (err) cb({ message: pythonFile + ' script failed' });
            if (result.length === items.length) cb(null, result);
            createChart(buildChartObject(JSON.parse(data)));
          });
        });
      }
    });
  });
};
