const responseHelper = require('./helpers/responseHelper');
const machineLearningService = require('./machineLearning');

exports.getChartSummaries = (req, res) => {
};

exports.getChartDetails = (req, res) => {
};

exports.buildCharts = (req, res) => {
    const callback = (err, data) => {
        if (err) responseHelper.error(res, 500, err);
        responseHelper.success(res, 200, data);
    };
    machineLearningService.buildCharts(callback)
}

