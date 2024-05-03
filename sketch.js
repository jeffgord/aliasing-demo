let freqSlider, sampleRateSlider;
let displayRatio = 20000; // each pixel represents a small fraction of time
let sampleStrokeWeight = 9;
let inputColor, reconstructionColor;

function setup() {
    let mainCanvas = createCanvas(1000, 600);
    mainCanvas.position((windowWidth - width) / 2, (windowHeight - height) / 2);

    renderSliderSection();

    inputColor = color(31, 147, 242);
    reconstructionColor = color(245, 158, 66);

    translate(10, height / 2);
    sketch();
}

function renderSliderSection() {
    freqSlider = createSlider(50, 400);
    sampleRateSlider = createSlider(500, 800, 800);

    freqSlider.position((windowWidth - width) / 2 + width * 0.1, 40);
    sampleRateSlider.position((windowWidth - width) / 2 + width * 0.5, 40);

    freqSlider.input(sketch);
    sampleRateSlider.input(sketch);
}

function sketch() {
    background(45);
    strokeWeight(1);
    stroke('black');
    noFill();

    drawAxis();
    drawInput();

    let samples = computeSamples();
    let fft = new FFT(samples.length, sampleRateSlider.value());
    fft.forward(samples);
    let reconstructedFreq = computeFreqFromSpectrum(fft.spectrum);

    drawReconstruction(reconstructedFreq);
    drawSamples(samples);
    drawInfo(reconstructedFreq);
    drawLegend();
}

function drawAxis() {
    strokeWeight(1);
    stroke('grey');
    line(0, 0, width, 0);
    line(0, height / 2, 0, - height / 2); // todo: remove this axis probably - it looks kinda bad
}

function drawInput() {
    strokeWeight(3);
    stroke(inputColor);
    drawSineWave(freqSlider.value(), 0);
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
        t = samp / sampleRateSlider.value();
        samples.push(sampleSine(t, freqSlider.value(), 0));
    }

    return samples;
}

function drawSamples(samples) {
    stroke('white');
    strokeWeight(sampleStrokeWeight);

    for (let samp = 0; samp < samples.length; samp++) {
        t = samp * 1 / sampleRateSlider.value();
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
    if (maxSamp === spectrum.length - 1) return freqSlider.value();

    // parabolic interpolation
    center = maxSamp + 0.5 * (spectrum[maxSamp - 1] - spectrum[maxSamp + 1]) / (spectrum[maxSamp - 1] - 2 * spectrum[maxSamp] + spectrum[maxSamp + 1]);
    let frequency = sampleRateSlider.value() * center / (2 * spectrum.length);
    return Math.round(frequency);
}

function drawReconstruction(frequency) {
    strokeWeight(3);
    stroke(reconstructionColor);

    let phase = Math.floor(freqSlider.value() / (0.5 * sampleRateSlider.value())) * Math.PI;
    if (frequency === freqSlider.value()) phase = 0; // need correction for when detected frequency is exactly 

    drawSineWave(frequency, phase);
}

function drawInfo(detectedFrequency) {
    strokeWeight(0);
    fill(255);
    textSize(15);
    textFont('Helvetica');
    textAlign(LEFT, CENTER);
    text(`Samples per period: ${(sampleRateSlider.value() / freqSlider.value()).toFixed(2)}`, width * 0.1, height * 0.4)
    text(`Detected frequency: ${detectedFrequency} Hz`, width * 0.1, height * 0.4 + 20);
}

function drawLegend() {
    stroke('white');
    strokeWeight(sampleStrokeWeight);
    point(width * 0.9 + 5, height * 0.4);

    strokeWeight(0);
    fill(255);
    textAlign(LEFT, CENTER);
    textSize(15);
    textFont('Helvetica');

    text('Sample', width * 0.9 + 20, height * 0.4);
    text('Input Signal', width * 0.5 + 55, height * 0.4);
    text('Reconstructed Signal', width * 0.7 + 25, height * 0.4);

    textFont('Courier New');
    textSize(80);
    fill(inputColor);
    text('~', width * 0.5, height * 0.4 + 2);

    fill(reconstructionColor);
    text('~', width * 0.7 - 30, height * 0.4 + 2);
}