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

// Only to suppress ESlint error
export const dummy = null;