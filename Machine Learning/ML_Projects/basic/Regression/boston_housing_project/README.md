# Boston Housing Price Prediction using Linear Regression 🏠📈

This project implements **Linear Regression** to predict housing prices using the **Boston Housing Dataset**.  
It serves as a **foundational Machine Learning project**, focusing on understanding the **end-to-end regression pipeline**.

---

## Problem Statement

Given various features of houses in Boston suburbs (such as crime rate, number of rooms, accessibility to highways, etc.),  
the task is to **predict the median house price**.

This is a **supervised regression problem**.

---

## Dataset

- **Name**: Boston Housing Dataset
- **Source**: CMU Stat Library / Scikit-learn (historical dataset)
- **Instances**: 506
- **Features**: 13
- **Target Variable**: Median value of owner-occupied homes (`MEDV`)

### Features

| Feature | Description                                            |
| ------- | ------------------------------------------------------ |
| CRIM    | Per capita crime rate                                  |
| ZN      | Proportion of residential land zoned                   |
| INDUS   | Proportion of non-retail business acres                |
| CHAS    | Charles River dummy variable                           |
| NOX     | Nitric oxides concentration                            |
| RM      | Average number of rooms                                |
| AGE     | Proportion of owner-occupied units built prior to 1940 |
| DIS     | Distance to employment centers                         |
| RAD     | Accessibility to highways                              |
| TAX     | Property tax rate                                      |
| PTRATIO | Pupil-teacher ratio                                    |
| B       | Proportion of Black population                         |
| LSTAT   | % lower status population                              |

---

## Concepts Covered

- Linear Regression theory
- Cost function (Mean Squared Error)
- Gradient Descent
- Feature scaling
- Train-test split
- Model evaluation
- Overfitting & underfitting (basic intuition)

---

## Tech Stack

- **Language**: Python
- **Libraries**:
  - NumPy
  - Pandas
  - Matplotlib / Seaborn
  - Scikit-learn

---

## Code Documentation

The Jupyter notebook is heavily commented to explain:

- Why each library is used
- How the dataset is reconstructed
- Statistical reasoning behind transformations
- Model training and evaluation steps

Each major block is accompanied by Markdown explanations for clarity.

## Design Decisions

- Log transformation applied to target variable to reduce skewness
- Feature selection based on correlation analysis
- Simple Linear Regression chosen as a baseline model

## Learning Outcomes

- Understanding real-world dataset handling
- Applying statistical reasoning in ML
- Building interpretable regression models
