import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';

/**
 * Calls QuickChart API to generate a PNG chart buffer.
 */
async function getChartBuffer(chartConfig: any, width = 600, height = 400): Promise<Buffer> {
  try {
    const response = await fetch('https://quickchart.io/chart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chart: chartConfig,
        width,
        height,
        backgroundColor: '#0F172A' // Slate 900 background to match dark mode theme
      })
    });

    if (!response.ok) {
      throw new Error(`QuickChart returned status ${response.status}: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error('Error generating chart from QuickChart:', error);
    throw error;
  }
}

/**
 * Uploads a buffer to Firebase Storage and returns the public download URL.
 */
export async function uploadBufferToStorage(buffer: Buffer, path: string, contentType: string): Promise<string> {
  try {
    const storageRef = ref(storage, path);
    const metadata = { contentType };
    await uploadBytes(storageRef, buffer, metadata);
    const url = await getDownloadURL(storageRef);
    return url;
  } catch (error) {
    console.error(`Error uploading buffer to Firebase Storage at ${path}:`, error);
    throw error;
  }
}

/**
 * Generates and uploads a Radar Chart for skill distribution.
 */
export async function generateAndUploadRadarChart(
  interviewId: string, 
  skillsData: Record<string, number>
): Promise<{ buffer: Buffer; url: string }> {
  const labels = Object.keys(skillsData);
  const values = Object.values(skillsData);

  const config = {
    type: 'radar',
    data: {
      labels,
      datasets: [
        {
          label: 'Skills Matrix',
          data: values,
          backgroundColor: 'rgba(99, 102, 241, 0.25)', // Indigo-500
          borderColor: 'rgba(99, 102, 241, 1)',
          pointBackgroundColor: 'rgba(34, 211, 238, 1)', // Cyan-400
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgba(99, 102, 241, 1)',
          borderWidth: 3,
        }
      ]
    },
    options: {
      legend: {
        labels: { fontColor: '#E2E8F0', fontSize: 13, fontFamily: 'monospace' }
      },
      scale: {
        gridLines: { color: 'rgba(255, 255, 255, 0.1)' },
        angleLines: { color: 'rgba(255, 255, 255, 0.15)' },
        ticks: {
          beginAtZero: true,
          max: 100,
          stepSize: 20,
          fontColor: '#94A3B8',
          showLabelBackdrop: false
        },
        pointLabels: {
          fontColor: '#E2E8F0',
          fontSize: 12,
          fontFamily: 'monospace'
        }
      }
    }
  };

  const buffer = await getChartBuffer(config, 500, 450);
  const url = await uploadBufferToStorage(buffer, `reports/${interviewId}/charts/skills_radar.png`, 'image/png');
  return { buffer, url };
}

/**
 * Generates and uploads a Bar Chart for topic scores.
 */
export async function generateAndUploadBarChart(
  interviewId: string,
  topicScores: Record<string, number>
): Promise<{ buffer: Buffer; url: string }> {
  const labels = Object.keys(topicScores);
  const values = Object.values(topicScores);

  const config = {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Score by Topic',
          data: values,
          backgroundColor: 'rgba(34, 211, 238, 0.65)', // Cyan-400
          borderColor: 'rgba(34, 211, 238, 1)',
          borderWidth: 2,
        }
      ]
    },
    options: {
      legend: { display: false },
      title: {
        display: true,
        text: 'Topic Scores',
        fontColor: '#E2E8F0',
        fontSize: 14,
        fontFamily: 'monospace'
      },
      scales: {
        xAxes: [
          {
            gridLines: { display: false },
            ticks: { fontColor: '#E2E8F0', fontFamily: 'monospace', fontSize: 11 }
          }
        ],
        yAxes: [
          {
            gridLines: { color: 'rgba(255, 255, 255, 0.1)' },
            ticks: {
              beginAtZero: true,
              max: 100,
              stepSize: 20,
              fontColor: '#94A3B8',
              fontFamily: 'monospace'
            }
          }
        ]
      }
    }
  };

  const buffer = await getChartBuffer(config, 550, 350);
  const url = await uploadBufferToStorage(buffer, `reports/${interviewId}/charts/topic_scores.png`, 'image/png');
  return { buffer, url };
}

/**
 * Generates and uploads a Line Graph showing improvement trends.
 */
export async function generateAndUploadTrendChart(
  userId: string,
  historyData: { date: string; score: number }[]
): Promise<{ buffer: Buffer; url: string }> {
  const labels = historyData.map(h => h.date);
  const values = historyData.map(h => h.score);

  const config = {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Overall Score Trend',
          data: values,
          fill: true,
          backgroundColor: 'rgba(168, 85, 247, 0.15)', // Purple-500
          borderColor: 'rgba(168, 85, 247, 1)',
          borderWidth: 3,
          pointBackgroundColor: 'rgba(236, 72, 153, 1)', // Pink-500
          pointRadius: 5,
          tension: 0.3
        }
      ]
    },
    options: {
      legend: {
        labels: { fontColor: '#E2E8F0', fontFamily: 'monospace' }
      },
      title: {
        display: true,
        text: 'Interview Performance Trend',
        fontColor: '#E2E8F0',
        fontSize: 14,
        fontFamily: 'monospace'
      },
      scales: {
        xAxes: [
          {
            gridLines: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { fontColor: '#94A3B8', fontFamily: 'monospace' }
          }
        ],
        yAxes: [
          {
            gridLines: { color: 'rgba(255, 255, 255, 0.1)' },
            ticks: {
              beginAtZero: true,
              max: 100,
              stepSize: 20,
              fontColor: '#94A3B8',
              fontFamily: 'monospace'
            }
          }
        ]
      }
    }
  };

  const buffer = await getChartBuffer(config, 600, 300);
  const url = await uploadBufferToStorage(buffer, `users/${userId}/charts/performance_trend.png`, 'image/png');
  return { buffer, url };
}
