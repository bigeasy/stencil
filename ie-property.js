! function () {
  var pseudo = 1;

  execScript('\
    Function ExecuteVBScript(code) \n\
      ExecuteGlobal(code) \n\
    End Function \n\
  ', 'VBScript');

  // Template VBScript class With psuedo-Hungarian notation and everything!
  var CLASS = '\
    Class PseudoObject_$INCREMENT$ \n\
      Private m_delegate \n\
    \n\
      Private Sub Class_Initialize(d) \n\
        m_delegate = delegate \n\
      End Sub \n\
    \n\
    $PROPERTIES$ \n\
    \n\
    End Class \n\
  ';

  var PROPERTY = '\
    Public Property Get $NAME$ \n\
      $NAME$ = m_delegate.$NAME$ \n\
    End Property \n\
  ';

  var FACTORY = '\
    Function PseudoObjectFactory_$INCREMENT$(delegate) \n\
      Dim o \n\
      Set o = New PseudoObject_$INCREMENT$(delegate) \n\
      Set PseudoObjectFactory_$INCREMENT$ = o \n\
    End Function \n\
  ';

  function template (template, substutions) {
    return template.replace(/\$([^$]+)\$/g, function ($, name) { return substutions[name] });
  }

  document.getElementById('pre').innerHTML = template(PROPERTY, { NAME: 'status' });
} ()
