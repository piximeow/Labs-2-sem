export function asyncMapCallback(array, asyncFn, callback, options = {}) {
    const results = [];
    let index = 0;
    const signal = options.signal;

    function next() {
        if (signal?.aborted) {
            callback(new Error("Operation aborted"), null);
            return;
        }

        if (index >= array.length) {
            callback(null, results);
            return;
        }

        const currentIndex = index++;

        asyncFn(array[currentIndex], currentIndex, array, (err, result) => {
            if (signal?.aborted) {
                callback(new Error("Operation aborted"), null);
                return;
            }

            if (err) {
                callback(err, null);
                return;
            }

            results[currentIndex] = result;
            next();
        });
    }

    next();
}


function asyncMapPromise(array, asyncFn, options = {}) {
    const signal = options.signal;

    return new Promise((resolve, reject) => {
        const results = [];
        let index = 0;

        function next() {
            if (signal?.aborted) {
                reject(new Error("Operation aborted"));
                return;
            }

            if (index >= array.length) {
                resolve(results);
                return;
            }

            const currentIndex = index++;

            asyncFn(array[currentIndex], currentIndex, array)
                .then(result => {
                    if (signal?.aborted) {
                        reject(new Error("Operation aborted"));
                        return;
                    }

                    results[currentIndex] = result;
                    next();
                })
                .catch(reject);
        }

        next();
    });
}