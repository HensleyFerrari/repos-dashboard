const { performance } = require('perf_hooks');

function oldApproach(sortedProjects) {
  let totalProjectsSize = 0;
  const chartData = [];

  const topProjects = sortedProjects.slice(0, 7);
  topProjects.forEach(p => {
    chartData.push({ name: p.name, value: p.sizeBytes });
    totalProjectsSize += p.sizeBytes;
  });

  const otherProjects = sortedProjects.slice(7);
  if (otherProjects.length > 0) {
    const otherProjSize = otherProjects.reduce((sum, p) => sum + p.sizeBytes, 0);
    chartData.push({ name: 'Outros Projetos', value: otherProjSize });
    totalProjectsSize += otherProjSize;
  }

  return { chartData, totalProjectsSize };
}

function newApproach(sortedProjects) {
  let totalProjectsSize = 0;
  const chartData = [];
  let otherProjSize = 0;

  for (let i = 0; i < sortedProjects.length; i++) {
    const p = sortedProjects[i];
    totalProjectsSize += p.sizeBytes;
    if (i < 7) {
      chartData.push({ name: p.name, value: p.sizeBytes });
    } else {
      otherProjSize += p.sizeBytes;
    }
  }

  if (otherProjSize > 0) {
    chartData.push({ name: 'Outros Projetos', value: otherProjSize });
  }

  return { chartData, totalProjectsSize };
}

// Generate test data
const numProjects = 10000;
const projects = Array.from({ length: numProjects }, (_, i) => ({
  name: `Project ${i}`,
  sizeBytes: Math.floor(Math.random() * 1000000)
}));
// Assuming sorted
projects.sort((a, b) => b.sizeBytes - a.sizeBytes);

const iterations = 10000;

let start = performance.now();
for (let i = 0; i < iterations; i++) {
  oldApproach(projects);
}
let end = performance.now();
console.log(`Old approach: ${end - start} ms`);

start = performance.now();
for (let i = 0; i < iterations; i++) {
  newApproach(projects);
}
end = performance.now();
console.log(`New approach: ${end - start} ms`);
