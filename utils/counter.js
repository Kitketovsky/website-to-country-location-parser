function counter() {
  let count = 0;

  return () => {
    return ++count;
  };
}

module.exports = counter;
