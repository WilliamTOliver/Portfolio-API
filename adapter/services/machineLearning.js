exports.buildCharts = cb => {
  const PythonShell = require('python-shell');
  const buildLinearChartObject = (chartData, chartName, callback) => {
    const chart = {};
    chart.xAxis = { type: 'value' };
    chart.yAxis = { type: 'value' };

    // FIXME: [0] should be removed after fixing python script effing this up
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
        type: 'scatter',
        data: chartData.yPred.map((yCoord, index) => {
          return [chartData.xTest[index][0], yCoord];
        })
      }
    ];
    callback(chart);
  };

  // Build Simple Linear Regression Data
  PythonShell.run('./services/simpleLinear.py', {}, function(err, data) {
    if (err) cb({ message: 'simple linear regression script failed' });

    buildLinearChartObject(
      JSON.parse(data),
      'Simple Linear',
      simpleLinearRegression => {
        // Build Multi Linear Regression Data
        PythonShell.run('./services/multiLinear.py', {}, function(err, data) {
          if (err) cb({ message: 'multi linear regression script failed' });

          buildLinearChartObject(
            JSON.parse(data),
            'Multiple Linear',
            multiLinearRegression => {
              cb(null, { simpleLinearRegression, multiLinearRegression });
            }
          );
        });
      }
    );
  });
};
