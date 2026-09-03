import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import '../../sass/Sony.scss';
import { difference } from '../utility';
import { useSnackbar } from 'notistack';

const Sony5 = (props) => {
    const { register, handleSubmit, setFocus } = useForm({
        startTime_2: 0,
        endTime_2: 0,
        startTime_4: 0,
        endTime_4: 0
    });
    const [isValid, setIsValid] = useState(false);

    const [canSubmit2, setCanSubmit2] = useState(true);
    const [canSubmit4, setCanSubmit4] = useState(true);

    const { enqueueSnackbar } = useSnackbar();

    // Sony5 mounts behind the banner, so the cue is the banner opening rather
    // than mount: drop straight into the first "Dva Džojstika" field.
    useEffect(() => {
        if (props.active) setFocus('startTime_2');
    }, [props.active, setFocus]);

    const onSubmit = (data) => {
        setIsValid(false)

        if (document.getElementById('input-5').value.length === 5 && document.getElementById('input-6').value.length === 5 && document.getElementById('input-7').value.length !== 5) {
            onSubmit_2(data)
        }

        if (document.getElementById('input-7').value.length === 5 && document.getElementById('input-8').value.length === 5 && document.getElementById('input-6').value.length !== 5) {
            onSubmit_4(data)
        }

        if (document.getElementById('input-5').value.length === 5
            && document.getElementById('input-6').value.length === 5
            && document.getElementById('input-7').value.length === 5
            && document.getElementById('input-8').value.length === 5
        ) {
            onSubmit_2(data);
            onSubmit_4(data);
        }

        props.goToDrinks();
    }

    const onSubmit_2 = (data) => {
        if (canSubmit2) {
            calculatePrice(data.startTime_2, data.endTime_2, 9);
            props.setCustomerDetails((prevState) => (
                {
                    ...prevState,
                    startTime_2: data.startTime_2,
                    endTime_2: data.endTime_2,
                    gamepads_2: '2 Dzojstika',
                    nameOfConsole: 'Sony 5'
                }
            ));
            setCanSubmit2(false)
            enqueueSnackbar(`Uneto vreme za dva dzojstika (SONY 5) od ${data.startTime_2} do ${data.endTime_2}`, { persist: true });
        }

    }
    const onSubmit_4 = (data) => {
        if (canSubmit4) {
            calculatePrice(data.startTime_4, data.endTime_4, 11.6666666667);
            props.setCustomerDetails((prevState) => (
                {
                    ...prevState,
                    startTime_4: data.startTime_4,
                    endTime_4: data.endTime_4,
                    gamepads_4: '4 Dzojstika',
                    nameOfConsole: 'Sony 5'
                }
            ));
            setCanSubmit4(false)
            enqueueSnackbar(`Uneto vreme za cetiri dzojstika (SONY 5) od ${data.startTime_4} do ${data.endTime_4}`, { persist: true });
        }
    }

    const calculatePrice =(startTime, endTime, pricePerMinute) => {
        props.setFinalPrice(prevPrice => prevPrice + Math.ceil(difference(startTime, endTime) * pricePerMinute));
        document.querySelectorAll('.form_input').forEach((input) => input.value = '');
    }

    const keyPressEvent = (e) => {
        if (e.target.value.length >= 5 && e.keyCode !== 8) {
            e.preventDefault()
        }

        if (e.keyCode === 8 && e.target.value.length === 3) {
            e.target.value = e.target.value.substring(0, 2)
        }
    }

    const addDotToInput = (e) => {
        if ((e.target.id === 'input-5' && e.target.value.length === 5) || (e.target.id === 'input-7' && e.target.value.length === 5)) {
            if (e.target.id === 'input-5') document.getElementById('input-6').focus();
            if (e.target.id === 'input-7') document.getElementById('input-8').focus();
        }

        if (
            document.getElementById('input-6').value.length === 5
            && document.getElementById('input-5').value.length === 5
            && (Number(document.getElementById('input-5').value.replace(":", '')) < Number(document.getElementById('input-6').value.replace(":", '')))
        ) {
            setIsValid(true);
        }

        if (
            document.getElementById('input-7').value.length === 5
            && document.getElementById('input-8').value.length === 5
            && (Number(document.getElementById('input-7').value.replace(":", '')) < Number(document.getElementById('input-8').value.replace(":", '')))
        ) {
            setIsValid(true);
        }

        if (
            document.getElementById('input-5').value.length === 5
            && document.getElementById('input-6').value.length === 5
            && document.getElementById('input-7').value.length === 5
            && document.getElementById('input-8').value.length === 5
            && (Number(document.getElementById('input-6').value.replace(":", '')) <= Number(document.getElementById('input-7').value.replace(":", '')))
        ) {
            setIsValid(true);
        }

        if (e.target.id === 'input-6' && e.target.value.length === 5) {
            setTimeout(() => {
                document.getElementById('submit-2').focus()
            }, 50)
        }

        if (e.target.id === 'input-8' && e.target.value.length === 5) {
            setTimeout(() => {
                document.getElementById('submit-2').focus()
            }, 50)
        }

        if (e.target.value.length === 2 && isNumber(e.target.value.substring(0, 2))) e.target.value = e.target.value + ':';

        if (Number(e.target.value[3]) > 5) {
            e.target.value = e.target.value.substring(3, e.target.length - 1)
        }
    }

    const isNumber = (char) => {
        if (typeof char !== 'string') {
            return false;
        }

        if (char.trim() === '') {
            return false;
        }

        return !isNaN(char);
    }

    return (
        <div className="sony__container">
            <div className="sony__header-title">
                <h1>Sony 5</h1>
            </div>
            <form className="sony__inner-content" onSubmit={handleSubmit(onSubmit)}>
                <div className="gamepads__form two__gamepads">
                    <h1>Dva Džojstika</h1>
                    <div>
                        <input id='input-5' {...register('startTime_2')} onKeyDown={(e) => keyPressEvent(e)} onChange={(e) => addDotToInput(e)} type="text" className='form_input' autoComplete="off"/>
                        <input id='input-6' {...register('endTime_2')} onKeyDown={(e) => keyPressEvent(e)} onChange={(e) => addDotToInput(e)} type="text" className='form_input' autoComplete="off"/>
                    </div>
                </div>
                <div className="gamepads__form four__gamepads">
                    <h1>Četiri Džojstika</h1>
                    <div>
                        <input id='input-7' {...register('startTime_4')} onKeyDown={(e) => keyPressEvent(e)} onChange={(e) => addDotToInput(e)} type="text" className='form_input' autoComplete="off"/>
                        <input id='input-8' {...register('endTime_4')} onKeyDown={(e) => keyPressEvent(e)} onChange={(e) => addDotToInput(e)} type="text" className='form_input' autoComplete="off"/>
                    </div>
                </div>
                <button id='submit-2' type='submit' disabled={!isValid} tabIndex="2">Izračunaj</button>
            </form>
        </div>
    );
}

export default Sony5;
