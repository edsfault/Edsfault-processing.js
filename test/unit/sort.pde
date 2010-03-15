float[] a = { 3.4, 3.6, 2, 0, 7.1 };
a = sort(a);

float[] expected_a = { 0, 2, 3.4, 3.6, 7.1 };
Assert.assertArrayEquals(expected_a, a);

String[] s = { "deer", "elephant", "bear", "aardvark", "cat" };
s = sort(s, 3);

String[] expected_s = { "bear", "deer", "elephant", "aardvark", "cat" };
Assert.assertArrayEquals(expected_s, s);


