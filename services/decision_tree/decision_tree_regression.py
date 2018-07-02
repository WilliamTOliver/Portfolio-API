# Decision Tree Regression

# Importing the libraries
import numpy as np
import pandas as pd
import json, sys

# Importing the dataset
dataset = pd.read_csv('./services/decision_tree/Position_Salaries.csv')
X = dataset.iloc[:, 1:2].values
y = dataset.iloc[:, 2].values

# Splitting the dataset into the Training set and Test set
"""from sklearn.cross_validation import train_test_split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size = 0.2, random_state = 0)"""

# Feature Scaling
"""from sklearn.preprocessing import StandardScaler
sc_X = StandardScaler()
X_train = sc_X.fit_transform(X_train)
X_test = sc_X.transform(X_test)
sc_y = StandardScaler()
y_train = sc_y.fit_transform(y_train)"""

# Fitting Decision Tree Regression to the dataset
from sklearn.tree import DecisionTreeRegressor
regressor = DecisionTreeRegressor(random_state = 0)
regressor.fit(X, y)

# Predicting a new result
y_pred = regressor.predict(6.5)

# Visualising the Decision Tree Regression results (higher resolution)
X_grid = np.arange(min(X), max(X), 0.01)
X_grid = X_grid.reshape((len(X_grid), 1))

print(json.dumps({
    'type': 'decisionTree',
    'name': 'Decision Tree',
    'description': 'decisionTree',
    'X': X.tolist(),
    'y': y.tolist(),
    'X_grid': X_grid.tolist(),
    'Y_grid': regressor.predict(X_grid).tolist()
}))
sys.stdout.flush()