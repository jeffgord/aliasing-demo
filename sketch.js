let sampleRateSlider;
let inputFreq = 100; // 100 Hz
let freqLabel, sampleRateLabel, detectedFreqLabel, samplesPerPeriodLabel;
let displayRatio = 20000; // each pixel represents a small fraction of time
let sampleStrokeWeight = 10;
let inputColor, reconstructionColor;

function setup() {
    let mainCanvas = createCanvas(1000, 600);
    mainCanvas.position((windowWidth - width) / 2, (windowHeight - height) * 0.7);

    renderSliderSection();

    inputColor = color(31, 147, 242);
    reconstructionColor = color(245, 158, 66);

    translate(10, height / 2);
    sketch();
}

function renderSliderSection() {
    sampleRateSlider = createSlider(0, 1000, 1000);

    let sliderX = windowWidth / 2 - sampleRateSlider.width / 2;
    let sliderY = (windowHeight - height) / 2 + 25;

    sampleRateSlider.position(sliderX, sliderY);

    sampleRateSlider.input(sketch);

    sampleRateLabel = createElement('p');
    sampleRateLabel.position(sliderX, sliderY - 50);
    sampleRateLabel.style('width', sampleRateSlider.width);

    samplesPerPeriodLabel = createElement('p');
    samplesPerPeriodLabel.position(sliderX, sliderY + 20);
    samplesPerPeriodLabel.style('width', sampleRateSlider.width);
}

// This is used to curve the values of the slider to be more concentrated towards the low end
// The formula is essentially this: minDesiredValue * e ^ (sliderValue * ln(maxDesiredValue / minDesiredValue) / maxSliderValue)
// Note that this assumes the slider starts at 0
// I have simplified the computation a bit here (by plugging in values) to get this function
function getSampleRate() {
    return Math.floor(50 * Math.pow(20, sampleRateSlider.value() / 1000));
}

function sketch() {
    background(45);
    strokeWeight(1);
    stroke('black');
    noFill();

    drawAxis();
    drawInput();

    let samples = computeSamples();
    let fft = new FFT(samples.length, getSampleRate());
    fft.forward(samples);
    let reconstructedFreq = computeFreqFromSpectrum(fft.spectrum);

    drawReconstruction(reconstructedFreq);
    drawSamples(samples);
    renderInfo();
    drawLegend(reconstructedFreq);
}

function drawAxis() {
    strokeWeight(1);
    stroke('grey');
    line(0, 0, width, 0);
}

function drawInput() {
    strokeWeight(3);
    stroke(inputColor);
    drawSineWave(inputFreq, 0);
}

function drawSineWave(frequency, phase) {
    beginShape();
    for (let x = 0; x < width; x += 0.5) { // iterative update can be adjusted for smoothness/performance tradeoff
        t = x / displayRatio;
        y = sampleSine(t, frequency, phase);
        curveVertex(x, y);
    }
    endShape()
}

function sampleSine(t, freq, phase) {
    if (freq === 0) return 0;
    let amp = - height * 3 / 10;
    return amp * Math.sin(2 * Math.PI * t * freq + phase);
}

function computeSamples() {
    samples = [];

    // compute enough samples for FFT
    for (let samp = 0; samp < 1024; samp++) {
        t = samp / getSampleRate();
        samples.push(sampleSine(t, inputFreq, 0));
    }

    return samples;
}

function drawSamples(samples) {
    stroke('white');
    strokeWeight(sampleStrokeWeight);

    for (let samp = 0; samp < samples.length; samp++) {
        t = samp * 1 / getSampleRate();
        x = t * displayRatio;
        point(x, samples[samp]);
    }
}

function computeFreqFromSpectrum(spectrum) {
    let maximum = spectrum[0];
    let maxSamp = 0;

    for (let samp = 1; samp < spectrum.length; samp++) {
        if (Math.abs(spectrum[samp]) > 1e-10 && spectrum[samp] > maximum) {
            maximum = spectrum[samp];
            maxSamp = samp;
        }
    }

    if (maxSamp === 0) return 0;
    if (maxSamp === spectrum.length - 1) return inputFreq;

    // parabolic interpolation
    center = maxSamp + 0.5 * (spectrum[maxSamp - 1] - spectrum[maxSamp + 1]) / (spectrum[maxSamp - 1] - 2 * spectrum[maxSamp] + spectrum[maxSamp + 1]);
    let frequency = getSampleRate() * center / (2 * spectrum.length);
    return Math.round(frequency);
}

function drawReconstruction(frequency) {
    strokeWeight(3);
    stroke(reconstructionColor);

    let phase = Math.floor(inputFreq / (0.5 * getSampleRate())) * Math.PI;
    if (frequency === inputFreq) phase = 0; // need correction for when detected frequency is exactly input

    drawSineWave(frequency, phase);
}

function renderInfo() {
    sampleRateLabel.html(`Sample Rate: ${getSampleRate()} Hz`);
    samplesPerPeriodLabel.html(`Samples Per Period: ${(getSampleRate() / inputFreq).toFixed(2)}`);
}

function drawLegend(detectedFrequency) {
    stroke('white');
    strokeWeight(sampleStrokeWeight);
    point(width * 0.9 + 5, height * 0.4);

    strokeWeight(0);
    fill(255);
    textAlign(LEFT, CENTER);
    textSize(15);
    textFont('Trebuchet MS');

    text('Sample', width * 0.9 + 20, height * 0.4);
    text(`Input Signal (${inputFreq} Hz)`, width * 0.4 + 25, height * 0.4);
    text(`Reconstructed Signal (${detectedFrequency} Hz)`, width * 0.6 + 55, height * 0.4);

    textFont('Courier New');
    textSize(80);
    fill(inputColor);
    text('~', width * 0.4 - 30, height * 0.4 + 2);

    fill(reconstructionColor);
    text('~', width * 0.6, height * 0.4 + 2);
}