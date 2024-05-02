let freqSlider, sampleRateSlider;
let displayRatio = 20000; // each pixel represents a small fraction of time

function setup() {
    freqSlider = createSlider(50, 400);
    sampleRateSlider = createSlider(500, 800, 800);
    freqSlider.input(sketch);
    sampleRateSlider.input(sketch)

    let mainCanvas = createCanvas(1000, 600);
    mainCanvas.parent('sketch-container');

    translate(10, height / 2);
    sketch();
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
    drawLegend();
}

function drawAxis() {
    strokeWeight(1);
    stroke('grey');
    line(0, 0, width, 0);
    line(0, height / 2, 0, - height / 2);
}

function drawInput() {
    strokeWeight(3);
    stroke(31, 147, 242);
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
    strokeWeight(9);

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
    stroke(245, 158, 66);

    let phase = Math.floor(freqSlider.value() / (0.5 * sampleRateSlider.value())) * Math.PI;
    if (frequency === freqSlider.value()) phase = 0; // need correction for when detected frequency is exactly 

    drawSineWave(frequency, phase);
}

function drawLegend() {

    stroke('white');

}