#!/usr/bin/env python3
"""Tests de doctrina para preceptoros.org V1.
Inspirados en test_nexo.py: precisos, sin falsos positivos."""
import unittest
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"

class Estructura(unittest.TestCase):
    def test_1_paginas_unicas_maximo_5(self):
        """Cuenta rutas base únicas, ignorando prefijos de idioma (/es/, /en/, /fr/)."""
        paginas = list(PUBLIC.rglob("*.html"))
        rutas_unicas = set()
        for p in paginas:
            # Eliminar el prefijo de idioma si existe
            partes = p.relative_to(PUBLIC).parts
            if partes[0] in ("es", "en", "fr"):
                ruta_base = "/".join(partes[1:])
            else:
                ruta_base = "/".join(partes)
            rutas_unicas.add(ruta_base)
        
        self.assertLessEqual(len(rutas_unicas), 5, 
            f"Demasiadas páginas únicas: {len(rutas_unicas)} -> {rutas_unicas}")
    
    def test_2_selector_por_path(self):
        index = (PUBLIC / "index.html").read_text()
        self.assertIn('href="/es/"', index)
        self.assertIn('href="/en/"', index)
        self.assertIn('href="/fr/"', index)
    
    def test_3_cero_frameworks_reales(self):
        """Busca patrones de importación, no subcadenas como 'vuelve'."""
        patrones_prohibidos = [
            r'<script[^>]*src=["\'].*react',
            r'<script[^>]*src=["\'].*vue',
            r'<script[^>]*src=["\'].*angular',
            r'<script[^>]*src=["\'].*htmx',
            r'<script[^>]*src=["\'].*alpine',
            r'<script[^>]*src=["\'].*jquery',
            r'import\s+.*\s+from\s+["\']react',
            r'import\s+.*\s+from\s+["\']vue',
        ]
        for html in PUBLIC.rglob("*.html"):
            texto = html.read_text().lower()
            for patron in patrones_prohibidos:
                match = re.search(patron, texto)
                self.assertIsNone(match, 
                    f"{html.name} contiene patrón de framework: {patron} -> {match.group(0) if match else ''}")

if __name__ == "__main__":
    unittest.main(verbosity=2)
