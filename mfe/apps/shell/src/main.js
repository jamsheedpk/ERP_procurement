// Async boundary so Module Federation can initialise shared singletons
// (react / react-dom / react-router-dom) before any app code runs.
import("./bootstrap.jsx");
