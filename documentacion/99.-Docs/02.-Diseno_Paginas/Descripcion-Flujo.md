## Componentes Generales y utilidad

#### Componentes Generales
Navbar

#### Flujo de Componentes de Acceso

Navbar <- AuthContext
    Portada 
        MapaInicio
    Especialistas
    MapaClinicas
    Formulario Login -> AuthContext
        Admin
            PanelAdmin
                PanelDemandaEspecialidades
                PanelDemandaMedicos
                ConfiguracionMedica
        Usuario
            PerfilUsuario
            Citas
                MisCitas
                ReservaCitas
                ReservaModal 
        Medico
            PanelMedico
            PerfilMedico
    Formulario Registro 

    
