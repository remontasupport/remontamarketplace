// Linted by test/boundary.test.ts as if it were src/probe.ts. Every import below
// must be rejected by P-6. Not type-checked, not linted in place.
import { Controller } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'
import { db } from '@remonta/db'
import { useState } from 'react'
import { NextResponse } from 'next/server'
import { readFile } from 'node:fs/promises'
import { join } from 'path'
export { Controller, PrismaClient, db, useState, NextResponse, readFile, join }
