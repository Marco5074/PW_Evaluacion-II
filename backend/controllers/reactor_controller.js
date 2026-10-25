//post/adjust

let temperaturaDeEstabilizacion = generarTemperatura(); 

function generarTemperatura(){
    return Math.floor(Math.random() * 100) + 1;
}

//ajustar temperatura

function validarTemperatura(req, res)
{
    //genera el numero aleatorio
    const {temperatura} = req.body?? {}; 

    if (typeof temperatura != 'number' || temperatura < 1 || temperatura > 100){
        return res.status(400).json({error: "Debe ingresar un número entre 1 y 100"});
    }

    if (temperatura < temperaturaDeEstabilizacion) {
        return res.json({mensaje: 'más alta'});
    } else if (temperatura > temperaturaDeEstabilizacion) {
        return res.json({mensaje: 'más baja'});
    } else {
        return res.json({mensaje: 'estabilizado'});
    }
}

//post/reboot

function reiniciarSistema(req, res) {
    temperaturaDeEstabilizacion = generarTemperatura();
    res.json({ mensaje: "Sistema reiniciado. Se ha generado una nueva temperatura de estabilización." });
}

export {
    validarTemperatura,
    reiniciarSistema
};