// ==UserScript==
// @name         Cita AutoComplete
// @namespace    http://xpam.net/
// @version      0.7
// @description  AutoComplete of the cita form
// @author       Andrey Luzhin
// @include      https://icp.administracionelectronica.gob.es/*
// @grant        none
// ==/UserScript==

(function() {

    'use strict';

    // Configuration
    const fullName = "John Smith"; // <<< Enter your name as on the document you going to use (Passport/TIE)
    const documentID = "000000000"; // <<< Enter document ID
    const documentDate = "01/01/2020"; // <<< Enter passport valid-until date (leave as is for TIE)
    const phoneNumber = "000000000"; // <<< Enter your phone number
    const eMail = "none@none.com"; // <<< Enter your email address
    const countryCode = "149"; // Rusia
    const proceduralAction = "4010"; // POLICIA-TOMA DE HUELLAS (EXPEDICIÓN DE TARJETA) Y RENOVACIÓN DE TARJETA DE LARGA DURACIÓN
    const provinciaFormURL = "/icpplustieb/citar?p=8&locale=es"; // Barcelona
    const isPassport = false; // if "true" - using passport, instead of NIE
    const isDate = false; // if "true" - fill date field. It's possible to fill the date field with an empty value, but it's safer not to touch anything that is not required.
    const defaultClickDelayMilliseconds = 5000

    // Constants
    const path = window.location.pathname;
    const page = path.split("/").pop();
    const firstPage = ['/icpplustie/icpplustieb/acOpcDirect',
                       '/icpplustie/icpplustieb/index.html',
                       '/icpplustie/icpplustieb/index',
                       '/icpplustieb/acOpcDirect',
                       '/icpplustieb/index.html',
                       '/icpplustieb/index',
                       '/icpplustieb/',
                       '/icpplustie/acOpcDirect',
                       '/icpplustie/index.html',
                       '/icpplustie/index',
                       '/icpplustie/',
                       'icpplus/index.html']; // There are a lot of ways to get to the front page, so I'm listing everything I've got.

    // Audio context
    let audioCtx;

    // Field value setting function. Check for element existance
    function setFieldValue(f, v) {
        var e = document.getElementById(f);
        if (e) e.value=v;
    }

    function initAudioContext() {
        // Only create the AudioContext if it doesn't exist or is closed
        if (!audioCtx || audioCtx.state === 'closed') {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        // If the context is suspended (e.g. by autoplay policy), resume it
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }

    // A small helper function to produce a beep sound via the Web Audio API.
    function beep(duration = 500, frequency = 440, volume = 1, type = 'sine') {
        // Create new audio context (or use webkitAudioContext if needed for older iOS)
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

        // Create an oscillator (the actual sound generator)
        const oscillator = audioCtx.createOscillator();

        // Create a gain node (volume control)
        const gainNode = audioCtx.createGain();

        // Connect the oscillator -> gain -> audio output (destination)
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        // Set options
        // sine, square, sawtooth, triangle
        oscillator.type = type;
        oscillator.frequency.value = frequency;
        gainNode.gain.value = volume;

        // Start the oscillator
        oscillator.start();

        // Stop it after the specified duration
        setTimeout(() => {
            oscillator.stop();
            audioCtx.close(); // Clean up audio context resources
        }, duration);
    }


    // Autoclick element function. Check for element existance
    function clickElement(e, delay_ms = defaultClickDelayMilliseconds) {
        const element = document.getElementById(e);
        if (!element) return;

        // Add a thick green border to the element
        element.style.border = "4px solid green";

        // Schedule the click after the delay
        setTimeout(() => {
            element.click();
        }, delay_ms);
    }


    // Select Barcelona on the front page
    if (firstPage.includes(path)) {
        var frm = document.getElementById('form');
        if (frm) {
            if (frm.nodeName == "SELECT") { // to make sure, that we change the select field
                frm.value=provinciaFormURL; // quick but dirty
                if (frm.options[frm.selectedIndex].text != 'Barcelona') alert('Something wrong!'); // quick check for form change
            }
        }
        /* // If they will change select url again, should use something like this:
        var formProvince = document.getElementById('form');
        if (formProvince) {
            if (formProvince.nodeName == "SELECT") { // to make sure, that we change the select field
                for (i = 0; i < formProvince.length; i++) {
                    if (formProvince.options[i].text == 'Barcelona') {
                        formProvince.options[i].selected = true;
                        break;
                    }
                }
            }
        }
        */
        clickElement('btnAceptar');
    }

    // Select procedure (second page)
    if (page == 'citar') {
        setFieldValue('tramiteGrupo[0]', proceduralAction);
        /* // more accurate, but have disadvantages
        var formProcedure = document.getElementById('tramiteGrupo[1]');
        if (formProcedure) {
            for (i = 0; i < formProcedure.length; i++) {
                if (formProcedure.options[i].text == 'POLICIA-TOMA DE HUELLAS (EXPEDICIÓN DE TARJETA) Y RENOVACIÓN DE TARJETA DE LARGA DURACIÓN') {
                    formProcedure.options[i].selected = true;
                    break;
                }
            }
        }
        */
        clickElement('btnAceptar');
    }

    // Agreement of procedure (third page)
    if (page == 'acInfo') {
        clickElement('btnEntrar');
        // they changed moment of notification, about absence of citas
        var bte = document.getElementById('btnEntrar');
        if (bte === null) { // NB: if they change id of "Entrar" button, this script will stop working properly
            //alert('No cita');
            clickElement('btnVolver'); // No cita, click "Volver"
        }
    }

    // Fill first form (fourth page)
    if (page == 'acEntrada') {
        // If document type is passport, selecting right radio button
        if (isPassport) clickElement('rdbTipoDocPas');
        // Document Number. One field for both NIE and passport
        setFieldValue('txtIdCitado', documentID);
        // Name and surname, in upper case
        setFieldValue('txtDesCitado', fullName.toUpperCase());
        // Date
        if (isDate) setFieldValue('txtFecha', documentDate);
        // Country selection
        setFieldValue('txtPaisNac', countryCode);
        // Click the 'Aceptar' button
        clickElement('btnEnviar');
    }

    // Click "Solicitar Cita" (fifth page)
    if (page == 'acValidarEntrada') {
        var messageDiv = document.getElementById('mensajeInfo')

        var btnSalir = null
        if (messageDiv != null) {
            clickElement('btnSubmit');
        } else if (btnSalir != null) {
            clickElement('btnSalir');
        } else {
            clickElement('btnEnviar');
        }
    }

    // Selection of the police department (sixth page)
    if (page == 'acCitar') {
        // Always select default option, if you want to select department manually, comment next string
        var bts = document.getElementById('btnSiguiente');
        if (bts != null) {
            initAudioContext();
            beep();
            clickElement('btnSiguiente'); // if Cita exists, proceed
        } else { // NB: if they change id of "Siguiente" button, this script will stop working properly
            // If cita not exists
            //Uncomment next string for autorepeat if no cita exists
            clickElement('btnSalir'); // No cita, click "Salir"
        }
    }

    // Second form filling (seventh page)
    if (page == 'acVerFormulario') {
        // Phone number
        setFieldValue('txtTelefonoCitado', phoneNumber);
        // e-mail
        setFieldValue('emailUNO', eMail);
        setFieldValue('emailDOS', eMail);

        clickElement('btnSiguiente');
    }

})();