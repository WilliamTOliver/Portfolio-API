const responseHelper = require('./helpers/responseHelper');
const chartBuilder = require('./chartBuilder');
const Chart = require('../models/chart');

exports.getCharts = (req, res) => {
    Chart.find({}, (err, charts) => {
        if (err) responseHelper.error(res, 500, err);
        responseHelper.success(res, 200, charts);    
    });
};

exports.getChartDetails = (req, res) => {
};

exports.buildCharts = (req, res) => {
    const callback = (err, data) => {
        if (err) responseHelper.error(res, 500, err);
        responseHelper.success(res, 200, data);
    };
    chartBuilder.buildCharts(callback)
}

