exports.buildCharts = cb => {
  const mongoose = require('mongoose');
  const fs = require('file-system');
  const PythonShell = require('python-shell');
  const Chart = require('../models/chart');
  const chartOrder = ['simpleLinear', 'polynomial', 'decisionTree', 'randomForest'];
  Chart.remove({}, err => {
    console.log('Cleared Chart Collection');
    const createChart = (chart, type, description, sortWeight) => {
      const newChart = new Chart({
        _id: new mongoose.Types.ObjectId(),
        chart,
        type,
        description,
        sortWeight
      });
      newChart.save();
    };
    const buildChartObject = (chartData, chartType) => {
      const chart = {};
      chart.title = {
        text: chartData.name
      };
      chart.tooltip = {
        trigger: 'axis',
        axisPointer: {
            type: 'cross'
        }
      },
      chart.xAxis = { type: 'value' };
      chart.yAxis = { type: 'value' };
      switch (chartData.type) {
        case 'simpleLinear':
          chart.series = [
            {
              color: 'red',
              name: 'Training Set',
              type: 'scatter',
              data: chartData.yTrain.map((yCoord, index) => {
                return [chartData.xTrain[index][0], yCoord];
              })
            },
            {
              color: 'blue',
              name: 'Test Set',
              type: 'scatter',
              data: chartData.yTest.map((yCoord, index) => {
                return [chartData.xTest[index][0], yCoord];
              })
            },
            {
              color: 'gold',
              name: 'Regression Model',
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
              name: 'Data',
              data: chartData.y.map((yCoord, index) => {
                return [chartData.X[index][0], yCoord];
              })
            },
            {
              color: 'blue',
              type: 'line',
              name: 'Regression Model',
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
        let item = items[i];
        fs.readdir(`./services/${item}`, function(err, items) {
          let pythonFile = items.filter(
            item => item.slice(item.length - 2, item.length) === 'py'
          )[0];
          PythonShell.run(`./services/${item}/${pythonFile}`, {}, function(
            err,
            data
          ) {
            if (err) cb({ message: pythonFile + ' script failed', error: err });
            console.log(err)
            if (data) {
              const parsedData = JSON.parse(data);
              console.log(parsedData.name + 'script succeeded')

              const type = parsedData.type;
              const description = parsedData.description;
              const sortWeight = chartOrder.indexOf(parsedData.type);
              createChart(buildChartObject(parsedData), type, description, sortWeight);
            }
          });
        });
      }
    });
  });
};
