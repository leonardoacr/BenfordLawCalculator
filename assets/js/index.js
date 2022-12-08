// define inputs from HTML
let input = document.querySelector('input');
let textarea = document.querySelector('textarea');
const ctx = document.getElementById('myChart');

// define global variables
let dataArray = [];
let file, lines;
let n = new Array(9).fill(0);
let rows = [], rowsBL = [], xAxis = [], rowsPercentage = [], rowsBLPercentage = [], errorBL = [];
let chiSquaredStat = [], chiSquaredStatSum, pValueFinal, chiFlag, pValueFlag;
let sum;
let myChart;

// define reset button from HTML
const resetBtnBox = document.querySelector(".reset-btn-box");
resetBtnBox.hidden = true;

// define file status (if is uploaded or not) from HTML
const fileStatus = document.getElementById('fileStatus');
fileStatus.textContent = 'Empty';

// detects if something was submited
input.addEventListener('change', () => {
  let files = input.files; // define files coming from HTML

  if (files.length == 0) return; // return function if array size is empty

  file = files[0];

  let reader = new FileReader(); // read buffer file submited

  reader.onload = (e) => {
    fileStatus.textContent = input.value.split(/(\\|\/)/g).pop(); // format the file
    resetBtnBox.hidden = false; // show reset button
    file = e.target.result; // file now is replaced with the actual data
    lines = file.split(/\r\n|\n/); // more formatting

    lines.forEach((el, i) => {
      dataArray[i] = parseFloat(el.split(',').join(''));
      console.log(dataArray[i])
    }); // just replace lines with dataArray for easy reading/
    console.log(dataArray)
    console.log(lines)
    // for that will take care of Benford law's algorithm 
    for (let data of dataArray) {
      getFirstPosition(data);
      verifyFirstPosition(firstPosition);
    }
    // plot the graph 
    plotGraph(n);
  };

  // verify error
  reader.onerror = (e) => alert(e.target.error.name);
  // plot text on the reader
  reader.readAsText(file)
});

function getFirstPosition(data) {
  absData = Math.abs(parseInt(data));
  strData = absData.toString();
  firstPosition = parseInt(strData[0]);
}

function verifyFirstPosition(firstPosition) {
  for (i = 1; i <= 9; i++) {
    if (firstPosition === i) n[i - 1]++;
  }
}

function plotGraph(n) {
  anychart.onDocumentReady(function () {
    // set the data in arrays
    for (let j in n) {
      rows[j] = n[j]; // submited data
      rowsBLPercentage[j] = 100 * Math.log10(1 + 1 / (parseInt(j) + 1)); // benford law prediction
      xAxis[j] = (parseInt(j) + 1).toString(); // x axis on the graph (1-9)
    };
    sum = rows.reduce((partialSum, a) => partialSum + a, 0); // sum all elements

    rowsPercentage = rows.map(function (x) { return 100 * x / sum; });

    rowsBL = rowsBLPercentage.map(function (x) { return x * sum / 100; }); // convert prediction to submited data relative

    errorBL = rows.map(function (x, j) { return 100 * (x - rowsBL[j]) / sum; });

    chiSquaredStat = rowsPercentage.map(function (x, j) { return (Math.pow(x - rowsBLPercentage[j], 2) / rowsBLPercentage[j]) });
    chiSquaredStatSum = chiSquaredStat.reduce((partialSum, a) => partialSum + a, 0); // sum all elements

    pValueFinal = pValue(8, chiSquaredStatSum);

    // tests with chiSquared and pValue
    chiFlag = chiSquaredStatSum > 20.09 ? 'Failed' : 'Passed';
    pValueFlag = pValueFinal > 5 ? 'Passed' : 'Failed';
    console.log(chiFlag)
    console.log(pValueFlag)
    createBarChart(rows, rowsBL, xAxis);
    insertTable();
  });
}

const createBarChart = (rows, rowsBL, xAxis, flagTheme) => {
  const opacity = 0.6;
  const blue = 'rgba(54, 162, 235,' + opacity + ')';
  const grape = 'rgba(111, 45, 168, ' + opacity + ')';
  const dataColor = grape;
  const predictionColor = blue;
  Chart.defaults.color = '#fff';
  chartDefaultColor(flagTheme); // this will change default color when the theme is changed
  myChart = new Chart(ctx, {
    type: 'bar',
    data: {
      datasets: [{
        label: 'Data (Bar)',
        data: rows,
        order: 1,
        backgroundColor: dataColor
      }, {
        label: 'BL Prediction',
        data: rowsBL,
        order: 2,
        backgroundColor: predictionColor
      }, {
        label: 'Data (Line)',
        data: rows,
        type: 'line',
        order: 3,
        borderColor: dataColor,
        backgroundColor: dataColor
      }, {
        label: 'BL Prediction (Line)',
        data: rowsBL,
        type: 'line',
        order: 4,
        borderColor: predictionColor,
        backgroundColor: predictionColor
      }],
      labels: xAxis
    },
    options: {
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

const insertTable = () => {
  const dataTable = document.getElementById("dataTable");
  dataTable.innerHTML =
    `<table class="table">
  <thead>
    <tr>
      <th scope="col">#</th>
      <th scope="col">Data (%)</th>
      <th scope="col">BL Prediction (%)</th>
      <th scope="col">Error (%)</th>
      <th scope="col">Chi-Squared Stat (%)</th>
      <th scope="col">Validation</th>
    </tr>
  </thead>
  <tbody>
  ${(function fun() { return loopTable() })()}
  </tbody>
</table>
<div class="box-BLVerify">
<div class="BLVerify">
${chiFlag === 'Passed' ?
      `<span class="footer-table fs-6 fw">Total Chi-Squared Stat: ${Number(chiSquaredStatSum).toFixed(2)}% &check;</span>` :
      `<span class="footer-table fs-6 fw">Total Chi-Squared Stat: ${Number(chiSquaredStatSum).toFixed(2)}% &#10006;</span>`
    }

${pValueFlag === 'Passed' ?
      `<span class="p-value footer-table fs-6 fw">p-value: ${Number(pValueFinal).toFixed(2)}% &check;</span>` :
      `<span class="p-value footer-table fs-6 fw">p-value: ${Number(pValueFinal).toFixed(2)}% &#10006;</span>`
    }
</div>
</div>
<br>
<div class="text-about">
<p> Conclusion:
${(chiFlag === 'Passed' && pValueFlag === 'Passed') ?
'The data was validated according to Benford Law theory and it has high chances to be a natural sequence.' :
'The data was not validated according to Benford Law theory and it is probably not natural sequence.'
}
<br>
<br>
The Benford's Law validation here is made considering when the Total Chi-Squared Stat is lower than 20% and 
p-value is greater than 5% (how far the data is from these limites means how far from a natural sequence your data is). 
Also, each row of Chi-Squared Stat has internal boundaries with 20/9 and it is validated in the last column. 
<br><br> 
Documentation can be found on the following links: 
<br>
<a href="https://evoq-eval.siam.org/Portals/0/Publications/SIURO/Vol1_Issue1/Testing_for_the_Benford_Property.pdf?ver=2018-03-30-130233-050">Testing for the Benford Law Property.</a>
<br>
<a href="https://blog.bigml.com/2015/05/15/detecting-numeric-irregularities-with-benfords-law/">Detecting Irregularities with Benford Law.</a>
<br>
<a href="https://ytliu0.github.io/p-value_calculators/docs/numerical_method.pdf">P-Value Calculators.</a>
<br>
<p> Source of example file:
<br>
<a href="https://data.ers.usda.gov/reports.aspx?ID=17827&AspxAutoDetectCookieSupport=1">United States population 2021.</a>
</p>
</div>`
}

function loopTable() {
  let tableArray = [], tableSum = '';
  for (let i = 1; i < 10; i++) {
    tableArray[i - 1] = `<tr>
    <th scope="row">${i}</th>
    <td>${Number(rowsPercentage[i - 1]).toFixed(2)}</td>
    <td>${Number(rowsBLPercentage[i - 1]).toFixed(2)}</td>
    <td>${Number(errorBL[i - 1]).toFixed(2)}</td>
    <td>${Number(chiSquaredStat[i - 1]).toFixed(2)}</td>
    <td>
    ${Number(chiSquaredStat[i - 1]).toFixed(2) > 20.09/9 ?
    ' &#10006;' : ' &check;'
    }
    </td>
    </tr>`;
    tableSum += tableArray[i - 1];
  }

  // const target = ',';
  // const filteredTableArray = tableArray.filter(el => el !== target);
  return tableSum;
}

const resetForm = () => {
  input.value = null;
}

let flagTheme = 1;
const body = document.querySelector('.main');
const card = document.querySelector('.card');

const changeTheme = () => {
  if (flagTheme === 1) {
    document.documentElement.style.setProperty('--colorRoot', '#000000');
    body.style.backgroundBlendMode = 'luminosity';
    card.style.background = 'rgba(255, 255, 255, .4)';
    chartDefaultColor(flagTheme);
    if (dataArray.length !== 0) {
      myChart.destroy();
      createBarChart(rows, rowsBL, xAxis, flagTheme);
    }
  }

  if (flagTheme === 2) {
    document.documentElement.style.setProperty('--colorRoot', '#ffffff');
    body.style.backgroundBlendMode = 'normal';
    card.style.background = 'rgba(0, 0, 0, .5)';
    chartDefaultColor(flagTheme);
    if (dataArray.length !== 0) {
      myChart.destroy();
      createBarChart(rows, rowsBL, xAxis, flagTheme);
    }
  }
  flagTheme++;
  if (flagTheme === 3) {
    flagTheme = 1;
  }
}

const chartDefaultColor = (flagTheme) => {
  if (flagTheme === 1) { return Chart.defaults.color = '#000'; }
  if (flagTheme === 2) { return Chart.defaults.color = '#fff'; }
}

// Extra content: p-value calculation
function pValue(dfInput, chiInput) {
  var df = dfInput;
  var chi2 = chiInput;

  var ptype = 1;

  var p = pchisq(chi2, df, ptype);
  var pval = 1.0 * p.toPrecision(4);
  return 100 * pval;
}

function pchisq(chi2, df, ptype) {
  if (ptype == 1) {
    return gammq(df, 0.5 * chi2);
  } else {
    return gammp(df, 0.5 * chi2);
  }
}

function gammq(df, x) {
  if (x < 0.5 * df + 1) {
    return 1 - gser(df, x);
  } else {
    return gcf(df, x);
  }
}

function gcf(df, x) {
  var maxit = 100000000;
  var eps = 1.e-8;
  var gln = gamnln(df);
  var a = 0.5 * df;
  var b = x + 1 - a;
  var fpmin = 1.e-300;
  var c = 1 / fpmin;
  var d = 1 / b;
  var h = d;
  for (var i = 1; i < maxit; i++) {
    var an = -i * (i - a);
    b += 2;
    d = an * d + b;
    if (Math.abs(d) < fpmin) { d = fpmin; }
    c = b + an / c;
    if (Math.abs(c) < fpmin) { c = fpmin; }
    d = 1 / d;
    var del = d * c;
    h = h * del;
    if (Math.abs(del - 1) < eps) { break; }
  }
  return h * Math.exp(-x + a * Math.log(x) - gln);
}

function gamnln(df) {
  var lg = [0.5723649429247001, 0, -0.1207822376352452, 0, 0.2846828704729192, 0.6931471805599453, 1.200973602347074, 1.791759469228055, 2.453736570842442, 3.178053830347946, 3.957813967618717, 4.787491742782046, 5.662562059857142, 6.579251212010101, 7.534364236758733, 8.525161361065415, 9.549267257300997, 10.60460290274525, 11.68933342079727, 12.80182748008147, 13.94062521940376, 15.10441257307552, 16.29200047656724, 17.50230784587389, 18.73434751193645, 19.98721449566188, 21.2600761562447, 22.55216385312342, 23.86276584168909, 25.19122118273868, 26.53691449111561, 27.89927138384089, 29.27775451504082, 30.67186010608068, 32.08111489594736, 33.50507345013689, 34.94331577687682, 36.39544520803305, 37.86108650896109, 39.3398841871995, 40.8315009745308, 42.33561646075349, 43.85192586067515, 45.3801388984769, 46.91997879580877, 48.47118135183522, 50.03349410501914, 51.60667556776437, 53.19049452616927, 54.78472939811231, 56.38916764371993, 58.00360522298051, 59.62784609588432, 61.26170176100199, 62.9049908288765, 64.55753862700632, 66.21917683354901, 67.88974313718154, 69.56908092082364, 71.257038967168, 72.9534711841694, 74.65823634883016, 76.37119786778275, 78.09222355331531, 79.82118541361436, 81.55795945611503, 83.30242550295004, 85.05446701758153, 86.81397094178108, 88.58082754219767, 90.35493026581838, 92.13617560368709, 93.92446296229978, 95.71969454214322, 97.52177522288821, 99.33061245478741, 101.1461161558646, 102.9681986145138, 104.7967743971583, 106.6317602606435, 108.4730750690654, 110.3206397147574, 112.1743770431779, 114.0342117814617, 115.9000704704145, 117.7718813997451, 119.6495745463449, 121.5330815154387, 123.4223354844396, 125.3172711493569, 127.2178246736118, 129.1239336391272, 131.0355369995686, 132.9525750356163, 134.8749893121619, 136.8027226373264, 138.7357190232026, 140.6739236482343, 142.617282821146, 144.5657439463449, 146.5192554907206, 148.477766951773, 150.4412288270019, 152.4095925844974, 154.3828106346716, 156.3608363030788, 158.3436238042692, 160.3311282166309, 162.3233054581712, 164.3201122631952, 166.3215061598404, 168.3274454484277, 170.3378891805928, 172.3527971391628, 174.3721298187452, 176.3958484069973, 178.4239147665485, 180.4562914175438, 182.4929415207863, 184.5338288614495, 186.5789178333379, 188.6281734236716, 190.6815611983747, 192.7390472878449, 194.8005983731871, 196.86618167289, 198.9357649299295, 201.0093163992815, 203.0868048358281, 205.1681994826412, 207.2534700596299, 209.3425867525368, 211.435520202271, 213.5322414945632, 215.6327221499328, 217.7369341139542, 219.8448497478113, 221.9564418191303, 224.0716834930795, 226.1905483237276, 228.3130102456502, 230.4390435657769, 232.5686229554685, 234.7017234428182, 236.8383204051684, 238.9783895618343, 241.1219069670290, 243.2688490029827, 245.4191923732478, 247.5729140961868, 249.7299914986334, 251.8904022097232, 254.0541241548883, 256.2211355500095, 258.3914148957209, 260.5649409718632, 262.7416928320802, 264.9216497985528, 267.1047914568685, 269.2910976510198, 271.4805484785288, 273.6731242856937, 275.8688056629533, 278.0675734403662, 280.2694086832001, 282.4742926876305, 284.6822069765408, 286.893133295427, 289.1070536083976, 291.3239500942703, 293.5438051427607, 295.7666013507606, 297.9923215187034, 300.2209486470141, 302.4524659326413, 304.6868567656687, 306.9241047260048, 309.1641935801469, 311.4071072780187, 313.652829949879, 315.9013459032995, 318.1526396202093, 320.4066957540055, 322.6634991267262, 324.9230347262869, 327.1852877037753, 329.4502433708053, 331.7178871969285, 333.9882048070999, 336.2611819791985, 338.5368046415996, 340.815058870799, 343.0959308890863, 345.3794070622669, 347.6654738974312, 349.9541180407703, 352.2453262754350, 354.5390855194408, 356.835382823613, 359.1342053695754];

  if (df < 201) {
    return lg[df - 1];
  }

  // For df>200, use the approx. formula given by numerical recipe
  // relative error < 2e-10
  var coef = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 1.208650973866179e-3, -5.395239384953e-6];
  var stp = 2.5066282746310005;
  var x = 0.5 * df;
  var y = x;
  var tmp = x + 5.5;
  tmp = (x + 0.5) * Math.log(tmp) - tmp;
  var ser = 1.000000000190015;
  for (var i = 0; i < 6; i++) {
    y = y + 1;
    ser = ser + coef[i] / y;
  }
  var gamln = tmp + Math.log(stp * ser / x);
  return gamln;
}

function gser(n, x) {
  var maxit = 100000000;
  var eps = 1.e-8;
  var gln = gamnln(n);
  var a = 0.5 * n;
  var ap = a;
  var sum = 1.0 / a;
  var del = sum;
  for (var n = 1; n < maxit; n++) {
    ap++;
    del = del * x / ap;
    sum += del;
    if (del < sum * eps) { break; }
  }
  return sum * Math.exp(-x + a * Math.log(x) - gln);
}

