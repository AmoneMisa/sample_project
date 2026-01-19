export default function (items: Array<{}> = []) {
    const chunked = [];
    for (let i = 0; i < items.length; i += 3) {
        chunked.push(items.slice(i, i + 3));
    }
    return chunked;
}