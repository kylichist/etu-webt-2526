import 'vuetify/styles';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';

export default createVuetify({
    components,
    directives,
    theme: {
        defaultTheme: 'light',
        themes: {
            light: {
                colors: {
                    primary: '#5E35B1',
                    secondary: '#1976D2',
                    accent: '#FF4081',
                },
            },
        },
    },
    defaults: {
        VBtn: { elevation: 2, rounded: 'lg' },
        VCard: { elevation: 6 },
    },
});
