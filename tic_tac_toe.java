import javax.swing.*;
import java.awt.*;
import java.awt.event.*;
import java.util.ArrayList;
import java.util.Random;

public class tic_tac_toe implements ActionListener {
    private JFrame frame;
    private JLayeredPane layeredPane;
    private JPanel boardPanel, overlayPanel;
    private JButton[] buttons = new JButton[9];
    private JLabel statusLabel, resultLabel, symbolLabel, scoreLabel;
    private boolean xTurn = true, gameOver = false;
    private int xScore = 0, oScore = 0;

    // Palette
    Color colorBg = new Color(10, 10, 10);
    Color colorCard = new Color(28, 28, 35);
    Color colorX = new Color(0, 255, 200);
    Color colorO = new Color(255, 40, 100);
    Color colorGold = new Color(255, 190, 0);
    Color colorReset = new Color(180, 180, 180);

    public tic_tac_toe() {
        frame = new JFrame("Tic-Tac-Toe Ultra");
        frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        
        BackgroundPanel bgPanel = new BackgroundPanel();
        bgPanel.setLayout(new GridBagLayout()); 
        frame.setContentPane(bgPanel);

        Dimension screenSize = Toolkit.getDefaultToolkit().getScreenSize();
        int gameHeight = (int)(screenSize.height * 0.8);
        int gameWidth = (int)(gameHeight * 0.7);

        layeredPane = new JLayeredPane();
        layeredPane.setPreferredSize(new Dimension(gameWidth, gameHeight));
        layeredPane.setOpaque(true);

        // 1. MAIN GAME BOARD
        boardPanel = new JPanel(new BorderLayout());
        boardPanel.setBackground(colorBg);
        boardPanel.setBounds(0, 0, gameWidth, gameHeight);

        statusLabel = new JLabel("PLAYER X", SwingConstants.CENTER);
        statusLabel.setFont(new Font("Arial Black", Font.BOLD, gameWidth / 12));
        statusLabel.setForeground(colorX);
        statusLabel.setBorder(BorderFactory.createEmptyBorder(gameHeight/25, 0, 10, 0));

        JPanel grid = new JPanel(new GridLayout(3, 3, gameWidth/35, gameWidth/35));
        grid.setBackground(colorBg);
        grid.setBorder(BorderFactory.createEmptyBorder(gameHeight/40, gameWidth/12, gameHeight/40, gameWidth/12));

        for (int i = 0; i < 9; i++) {
            buttons[i] = new JButton();
            buttons[i].setFont(new Font("Verdana", Font.BOLD, gameWidth / 6));
            buttons[i].setFocusPainted(false);
            buttons[i].setBackground(colorCard);
            buttons[i].setForeground(colorBg);
            buttons[i].setBorder(BorderFactory.createLineBorder(new Color(45, 45, 55), 2));
            buttons[i].addActionListener(this);
            grid.add(buttons[i]);
        }

        scoreLabel = new JLabel("X: 0  |  O: 0", SwingConstants.CENTER);
        scoreLabel.setFont(new Font("Arial Black", Font.PLAIN, gameWidth / 22));
        scoreLabel.setForeground(Color.WHITE);
        scoreLabel.setBorder(BorderFactory.createEmptyBorder(10, 0, 20, 0));
        
        boardPanel.add(statusLabel, BorderLayout.NORTH);
        boardPanel.add(grid, BorderLayout.CENTER);
        boardPanel.add(scoreLabel, BorderLayout.SOUTH);

        // 2. VICTORY OVERLAY
        overlayPanel = new JPanel(new GridBagLayout());
        overlayPanel.setBackground(Color.BLACK); 
        overlayPanel.setBounds(0, 0, gameWidth, gameHeight);
        overlayPanel.setVisible(false);

        JPanel container = new JPanel();
        container.setLayout(new BoxLayout(container, BoxLayout.Y_AXIS));
        container.setOpaque(false);

        symbolLabel = new JLabel("", SwingConstants.CENTER);
        symbolLabel.setFont(new Font("Verdana", Font.BOLD, gameWidth / 4));
        symbolLabel.setAlignmentX(Component.CENTER_ALIGNMENT);

        resultLabel = new JLabel("VICTORIOUS!", SwingConstants.CENTER);
        resultLabel.setFont(new Font("Verdana", Font.BOLD, gameWidth / 11));
        resultLabel.setForeground(Color.WHITE); 
        resultLabel.setAlignmentX(Component.CENTER_ALIGNMENT);
        
        // Button Panel for Two Buttons
        JPanel btnPanel = new JPanel();
        btnPanel.setOpaque(false);
        btnPanel.setLayout(new FlowLayout(FlowLayout.CENTER, 20, 0));

        JButton playAgainBtn = new JButton("REPLAY");
        styleButton(playAgainBtn, colorGold, Color.BLACK, gameWidth);
        playAgainBtn.addActionListener(e -> resetGame(false));

        JButton resetScoreBtn = new JButton("RESET");
        styleButton(resetScoreBtn, colorReset, Color.BLACK, gameWidth);
        resetScoreBtn.addActionListener(e -> resetGame(true));

        btnPanel.add(playAgainBtn);
        btnPanel.add(resetScoreBtn);
        btnPanel.setAlignmentX(Component.CENTER_ALIGNMENT);

        container.add(Box.createVerticalGlue());
        container.add(symbolLabel);
        container.add(Box.createRigidArea(new Dimension(0, 10)));
        container.add(resultLabel);
        container.add(Box.createRigidArea(new Dimension(0, 50)));
        container.add(btnPanel);
        container.add(Box.createVerticalGlue());
        overlayPanel.add(container);

        layeredPane.add(boardPanel, JLayeredPane.DEFAULT_LAYER);
        layeredPane.add(overlayPanel, JLayeredPane.POPUP_LAYER);

        frame.add(layeredPane);
        frame.pack();
        frame.setLocationRelativeTo(null);
        frame.setVisible(true);
    }

    private void styleButton(JButton btn, Color bg, Color fg, int width) {
        btn.setFont(new Font("Arial Black", Font.PLAIN, width / 28));
        btn.setBackground(bg);
        btn.setForeground(fg);
        btn.setFocusPainted(false);
        btn.setCursor(new Cursor(Cursor.HAND_CURSOR));
        btn.setBorder(BorderFactory.createEmptyBorder(12, 25, 12, 25));
    }

    // --- LOGIC ---
    public void actionPerformed(ActionEvent e) {
        JButton btn = (JButton) e.getSource();
        if (!btn.getText().equals("") || gameOver) return;
        btn.setText(xTurn ? "X" : "O");
        btn.setForeground(xTurn ? colorX : colorO);
        xTurn = !xTurn;
        statusLabel.setText(xTurn ? "PLAYER X" : "PLAYER O");
        statusLabel.setForeground(xTurn ? colorX : colorO);
        checkForWinner();
    }

    private void checkForWinner() {
        int[][] wins = {{0,1,2},{3,4,5},{6,7,8},{0,3,6},{1,4,7},{2,5,8},{0,4,8},{2,4,6}};
        for (int[] w : wins) {
            if (!buttons[w[0]].getText().equals("") &&
                buttons[w[0]].getText().equals(buttons[w[1]].getText()) &&
                buttons[w[0]].getText().equals(buttons[w[2]].getText())) {
                gameOver = true;
                if (buttons[w[0]].getText().equals("X")) xScore++; else oScore++;
                scoreLabel.setText("X: " + xScore + "  |  O: " + oScore);
                showVictory(buttons[w[0]].getText());
                return;
            }
        }
        boolean tie = true;
        for (JButton b : buttons) if (b.getText().isEmpty()) tie = false;
        if (tie) showTie();
    }

    private void showVictory(String winner) {
        symbolLabel.setText(winner);
        symbolLabel.setForeground(winner.equals("X") ? colorX : colorO);
        resultLabel.setText("VICTORIOUS!");
        overlayPanel.setVisible(true);
    }

    private void showTie() {
        symbolLabel.setText("=");
        symbolLabel.setForeground(Color.GRAY);
        resultLabel.setText("DRAW GAME");
        overlayPanel.setVisible(true);
    }

    public void resetGame(boolean resetScores) {
        if (resetScores) {
            xScore = 0;
            oScore = 0;
            scoreLabel.setText("X: 0  |  O: 0");
        }
        for (JButton b : buttons) {
            b.setText("");
            b.setBackground(colorCard);
        }
        xTurn = true;
        gameOver = false;
        overlayPanel.setVisible(false);
        statusLabel.setText("PLAYER X");
        statusLabel.setForeground(colorX);
    }

    // --- BACKGROUND ENGINE ---
    class BackgroundPanel extends JPanel {
        private ArrayList<Sticker> stickers = new ArrayList<>();
        private Random rand = new Random();
        public BackgroundPanel() {
            setBackground(Color.BLACK); setDoubleBuffered(true);
            for (int i = 0; i < 30; i++) stickers.add(new Sticker());
            new Timer(20, e -> { for (Sticker s : stickers) s.move(); repaint(); }).start();
        }
        @Override protected void paintComponent(Graphics g) {
            super.paintComponent(g); Graphics2D g2d = (Graphics2D) g;
            g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            for (Sticker s : stickers) s.draw(g2d);
        }
        class Sticker {
            double x, y, speed, angle, rot, rotSpeed; String label; Color color; int size;
            Sticker() { reset(true); }
            void reset(boolean firstTime) {
                Dimension scr = Toolkit.getDefaultToolkit().getScreenSize();
                x = rand.nextInt(scr.width); y = firstTime ? rand.nextInt(scr.height) : -100;
                speed = rand.nextDouble() * 1.5 + 0.5; angle = Math.toRadians(rand.nextInt(20) + 80); 
                rot = rand.nextInt(360); rotSpeed = rand.nextDouble() * 2 - 1;
                label = rand.nextBoolean() ? "X" : "O"; color = label.equals("X") ? colorX : colorO; size = rand.nextInt(20) + 15;
            }
            void move() { x += Math.cos(angle) * speed; y += Math.sin(angle) * speed; rot += rotSpeed; if (y > getHeight() + 100) reset(false); }
            void draw(Graphics2D g2d) {
                g2d.setFont(new Font("Arial", Font.BOLD, size)); g2d.setColor(new Color(color.getRed(), color.getGreen(), color.getBlue(), 35));
                java.awt.geom.AffineTransform oldTransform = g2d.getTransform(); g2d.translate(x, y); g2d.rotate(Math.toRadians(rot));
                g2d.drawString(label, 0, 0); g2d.setTransform(oldTransform);
            }
        }
    }

    public static void main(String[] args) { new tic_tac_toe(); }
}