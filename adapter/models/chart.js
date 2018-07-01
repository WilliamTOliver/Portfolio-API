const mongoose = require('mongoose');

const chartSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    chart: {
        type: { type: String },
        series: Array,
        xAxis: {type: {type: String}},
        yAxis: {type: {type: String}},
    }
});

module.exports = mongoose.model('Chart', chartSchema);