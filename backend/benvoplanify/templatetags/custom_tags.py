from django import template

register = template.Library()

@register.filter
def dict_get(dictionary, key):
    """Accès à une clé de dictionnaire : {{ d|dict_get:cle }}"""
    return dictionary.get(key)

@register.filter
def choice_label(choices, key):
    """Libellé d'un choix (liste de tuples) : {{ JOURS|choice_label:0 }} -> 'Lundi'"""
    return dict(choices).get(key, '')

@register.simple_tag
def est_indispo(indispo, jour, creneau):
    return (jour, creneau) in indispo
