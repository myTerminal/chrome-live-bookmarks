// Function to sort an array in descending order on an object property
export const getSortedArrayByDescending = (array, property) =>
    array
        .slice(0)
        .sort(
            (a, b) => {
                if (a[property] < b[property]) {
                    return -1;
                } else if (a[property] > b[property]) {
                    return 1;
                } else {
                    return 0;
                }
            }
        );

// Function to flatten bookmark under a node into a collection
export const flattenTree = node =>
    [node]
        .concat(
            node.children
                ? node.children
                    .map(n => flattenTree(n))
                    .reduce((a, c) => a.concat(c), [])
                : []
        );

// Function to toggle a preference
export const toggleProperty = (property, values) => {
    property.get(
        currentValue => {
            const projectedValue = currentValue === values[0]
                ? values[1]
                : values[0];

            property.set(projectedValue);
        }
    );
};
