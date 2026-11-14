import numpy as np

from sklearn.discriminant_analysis import LinearDiscriminantAnalysis  

X = np.array([[1,-1],[-2,2],[-3,2],[1,1],[2,1],[3,2]])
y = np.arrat([1,4,5,6,2,1])
clf = LinearDiscriminantAnalysis()
clf.fit(X,y)
LinearDiscriminantAnalysis()
print(clf.predict([[-.8,-1]]))