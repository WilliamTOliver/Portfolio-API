const User = require('../models/user');
exports.findByEmail = (email) => {
    return User.find({ email }).exec();
};
exports.delete = (id) => {
    return User.remove({ _id: id }).exec();
};
exports.create = (userObject, hashedPassword) => {
    const newUser = new User({
        _id: new mongoose.Types.ObjectId(),
        email: userObject.email,
        password: hash,
        application: userObject.application,
        role: userObject.role
    });
    return newUser.save();
};